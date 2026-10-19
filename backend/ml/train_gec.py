import os
import sys
import json
import time
import argparse
import logging
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

logger = logging.getLogger('readify_trainer')

def parse_args():
    parser = argparse.ArgumentParser(description="Reproducible Fine-Tuning Pipeline for Readify GEC T5 Model")
    parser.add_argument("--model_name", type=str, default="t5-small", help="Pretrained Hugging Face seq2seq model name")
    parser.add_argument("--dataset_path", type=str, default="backend/ml/data/train.json", help="Path to training json dataset")
    parser.add_argument("--val_path", type=str, default="backend/ml/data/val.json", help="Path to validation json dataset")
    parser.add_argument("--checkpoint_dir", type=str, default="backend/ml/checkpoints", help="Output directory for fine-tuned checkpoints")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=4, help="Per-device training batch size")
    parser.add_argument("--learning_rate", type=float, default=3e-4, help="Peak AdamW learning rate")
    parser.add_argument("--max_length", type=int, default=128, help="Maximum sequence token length")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--sample_limit", type=int, default=None, help="Limit number of training samples for quick demonstration")
    parser.add_argument("--dry_run", action="store_true", help="Perform a dry run (single batch forward & backward) to verify environment without long training")
    return parser.parse_args()

def train():
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

    logger.info("=" * 60)
    logger.info("READIFY GEC MODEL FINE-TUNING PIPELINE")
    logger.info("=" * 60)
    logger.info("Base Model:        %s", args.model_name)
    logger.info("Dataset Train:     %s", args.dataset_path)
    logger.info("Dataset Val:       %s", args.val_path)
    logger.info("Checkpoint Dir:    %s", args.checkpoint_dir)
    logger.info("Epochs:            %d", args.epochs)
    logger.info("Batch Size:        %d", args.batch_size)
    logger.info("Learning Rate:     %s", args.learning_rate)
    logger.info("Random Seed:       %d", args.seed)
    logger.info("Dry Run Mode:      %s", args.dry_run)

    # 1. Check datasets
    train_file = Path(args.dataset_path)
    val_file = Path(args.val_path)

    if not train_file.exists() or not val_file.exists():
        logger.info("Datasets not found at specified paths. Generating benchmark splits...")
        from backend.ml.dataset_manager import dataset_manager
        dataset_manager.prepare_dataset()

    with open(train_file, 'r', encoding='utf-8') as f:
        train_data = json.load(f)
    with open(val_file, 'r', encoding='utf-8') as f:
        val_data = json.load(f)

    if args.sample_limit:
        train_data = train_data[:args.sample_limit]
        val_data = val_data[:max(2, args.sample_limit // 4)]

    logger.info("Loaded %d training samples and %d validation samples.", len(train_data), len(val_data))

    # 2. Imports and Device Setup
    import torch
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

    torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Active Compute Device: %s", device)

    # 3. Load Tokenizer & Model
    logger.info("Loading tokenizer and model '%s'...", args.model_name)
    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(args.model_name)
    model.to(device)

    checkpoint_path = Path(args.checkpoint_dir)
    checkpoint_path.mkdir(parents=True, exist_ok=True)

    # 4. Tokenize & Prepare Tensors
    def prepare_batch(data_slice):
        inputs = ["grammar: " + item['input'] for item in data_slice]
        targets = [item['target'] for item in data_slice]

        model_inputs = tokenizer(inputs, max_length=args.max_length, padding=True, truncation=True, return_tensors="pt")
        labels = tokenizer(targets, max_length=args.max_length, padding=True, truncation=True, return_tensors="pt").input_ids
        # Replace padding token id with -100 so it is ignored by loss function
        labels[labels == tokenizer.pad_token_id] = -100
        model_inputs["labels"] = labels
        return {k: v.to(device) for k, v in model_inputs.items()}

    # 5. Optimizer & Setup
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate)
    training_history = []
    start_time = time.time()

    total_epochs = 1 if args.dry_run else args.epochs
    logger.info("Commencing training for %d epoch(s)...", total_epochs)

    for epoch in range(1, total_epochs + 1):
        model.train()
        epoch_loss = 0.0
        steps = 0

        # Batch iteration
        for i in range(0, len(train_data), args.batch_size):
            batch_slice = train_data[i:i + args.batch_size]
            batch = prepare_batch(batch_slice)

            optimizer.zero_grad()
            outputs = model(**batch)
            loss = outputs.loss
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()
            steps += 1

            if args.dry_run:
                logger.info("[Dry Run] Single forward-backward pass succeeded! Loss: %.4f", loss.item())
                break

        avg_train_loss = round(epoch_loss / max(1, steps), 4)

        # Validation Step
        model.eval()
        val_loss = 0.0
        val_steps = 0
        with torch.no_grad():
            for i in range(0, len(val_data), args.batch_size):
                batch_slice = val_data[i:i + args.batch_size]
                batch = prepare_batch(batch_slice)
                outputs = model(**batch)
                val_loss += outputs.loss.item()
                val_steps += 1
                if args.dry_run:
                    break

        avg_val_loss = round(val_loss / max(1, val_steps), 4)

        log_entry = {
            'epoch': epoch,
            'train_loss': avg_train_loss,
            'val_loss': avg_val_loss,
            'learning_rate': args.learning_rate,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        training_history.append(log_entry)
        logger.info("Epoch %d/%d - Train Loss: %.4f - Val Loss: %.4f", epoch, total_epochs, avg_train_loss, avg_val_loss)

    elapsed = round(time.time() - start_time, 2)
    logger.info("Training process completed in %.2f seconds.", elapsed)

    # 6. Save Checkpoint & Metadata
    logger.info("Saving checkpoint to %s...", checkpoint_path)
    model.save_pretrained(checkpoint_path)
    tokenizer.save_pretrained(checkpoint_path)

    # Save training configuration & history log
    meta = {
        'model_name': args.model_name,
        'dataset_train_samples': len(train_data),
        'dataset_val_samples': len(val_data),
        'epochs': total_epochs,
        'batch_size': args.batch_size,
        'learning_rate': args.learning_rate,
        'elapsed_seconds': elapsed,
        'device': str(device),
        'dry_run': args.dry_run,
        'history': training_history,
        'completed_at': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    with open(checkpoint_path / "training_log.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    logger.info("=" * 60)
    logger.info("CHECKPOINT SUCCESSFULLY SAVED!")
    logger.info("Model weights, tokenizer, and training_log.json are located in: %s", checkpoint_path)
    logger.info("=" * 60)

if __name__ == "__main__":
    train()
