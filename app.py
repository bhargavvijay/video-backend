import sys
import json
from collections import defaultdict
from transformers import pipeline

input_data = json.load(sys.stdin)

transcripts = input_data['transcripts']
roles = input_data['roles']

role_texts = defaultdict(str)

for speaker, text in transcripts.items():
    role = roles.get(speaker, "unknown")
    role_texts[role] += " " + text

summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

for role, text in role_texts.items():
    print(f"\n--- {role.capitalize()} Summary ---")
    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
    summaries = summarizer(chunks, max_length=100, min_length=30, do_sample=False)
    final_summary = "\n".join([s['summary_text'] for s in summaries])
    print(final_summary)