def process_file(input_file, output_file):
    """
    Reads a text file and writes a new file:
    - Excluding lines that start with 'r/'
    - Removing blank lines
    - Stripping extra whitespace
    
    Args:
        input_file (str): Path to the input text file
        output_file (str): Path where the filtered output will be saved
    """
    try:
        # Read input file and filter lines
        with open(input_file, 'r') as f:
            # Process each line:
            # 1. Strip whitespace
            # 2. Skip empty lines and lines starting with r/
            # 3. Add back single newline character
            lines = [line.strip() + '\n' 
                    for line in f 
                    if line.strip() and not line.strip().startswith('r/')]
        
        # Write filtered content to output file
        with open(output_file, 'w') as f:
            f.writelines(lines)
            
        print(f"Successfully processed {input_file}")
        print(f"Lines removed:")
        print("- Lines starting with 'r/'")
        print("- Blank lines")
        print("- Extra whitespace at start/end of lines")
        print(f"Output saved to {output_file}")
            
    except FileNotFoundError:
        print(f"Error: Could not find file {input_file}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

# Example usage
if __name__ == "__main__":
    process_file('hobby_list_reddit.txt', 'output.txt')