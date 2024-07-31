with open("projection_info.txt", "r", encoding="utf-8") as file:
    for line in file:
        split_line = line.strip().split(": ")

        # Check if there are more than two parts after splitting
        if len(split_line) > 2:
            # Combine multiple parts into a single key or value
            key_parts = []
            value_parts = []

            for part in split_line:
                if part.startswith(":"):
                    key_parts.append(part)
                else:
                    value_parts.append(part)

            # Form the key and value from the combined parts
            key = ":".join(key_parts)
            value = " ".join(value_parts)
        else:
            # Handle lines with two or less parts like before
            key, value = split_line

        print(f"{key:20}: {value}")
