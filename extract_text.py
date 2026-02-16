import json
import re

input_file = "/Users/arthursantos/Desktop/cli-use/.excalidraw"
output_file = "/Users/arthursantos/Desktop/cli-use/excalidraw_text.txt"

with open(input_file, "r") as f:
    lines = f.readlines()

# Process lines starting from 4665 (index 4664)
lines_to_process = lines[4664:]

extracted_texts = []

for line in lines_to_process:
    line = line.strip()
    if line.startswith('"text":'):
        # Extract the part after "text":
        # We expect: "text": "value", or "text": "value"
        parts = line.split(":", 1)
        if len(parts) == 2:
            value_part = parts[1].strip()

            # value_part should be "string", or "string"
            if value_part.startswith('"'):
                # find the last quote
                last_quote_index = value_part.rfind('"')
                if last_quote_index > 0:
                    json_string = value_part[: last_quote_index + 1]
                    try:
                        decoded_text = json.loads(json_string)
                        extracted_texts.append(decoded_text)
                    except json.JSONDecodeError:
                        pass

count = 1
with open(output_file, "w") as f:
    for text in extracted_texts:
        # Replace literal \n with actual newlines if needed, or keep them.
        # The previous script used json.loads so \n in the string became a newline character.
        f.write(f"{count}. {text}\n\n")
        count += 1
