from bs4 import BeautifulSoup
from datetime import datetime
import re

def clean_text(text):
    """
    Clean text by removing extra whitespace and newlines.
    
    Args:
        text (str): Text to clean
        
    Returns:
        str: Cleaned text
    """
    # Replace multiple whitespace characters (including newlines) with a single space
    cleaned = re.sub(r'\s+', ' ', text)
    # Strip leading and trailing whitespace
    return cleaned.strip()

def extract_link_texts(html_file_path, output_file_path=None):
    """
    Extract text from all <a> tags within the 'a-z-list' class and optionally save to file.
    
    Args:
        html_file_path (str): Path to the HTML file
        output_file_path (str, optional): Path to save the output text file
        
    Returns:
        list: List of strings containing the text from each <a> tag
    """
    # Read the HTML file
    with open(html_file_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    # Create BeautifulSoup object
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find the div with class 'a-z-list'
    az_list = soup.find('div', class_='a-z-list')
    
    if not az_list:
        print("No 'a-z-list' class found in the HTML file.")
        return []
    
    # Find all <a> tags within the a-z-list div
    links = az_list.find_all('a')
    
    # Extract text from each link and clean it
    link_texts = [clean_text(link.get_text()) for link in links]
    
    # Print to console and write to file
    if output_file_path:
        with open(output_file_path, 'w', encoding='utf-8') as output_file:
            # Write header with timestamp
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            output_file.write(f"Link texts extracted on {timestamp}\n")
            output_file.write("=" * 50 + "\n\n")
            
            # Write each link text
            for i, text in enumerate(link_texts, 1):
                line = f"{i}. {text}\n"
                print(line, end='')  # Print to console
                output_file.write(line)  # Write to file
            
            # Write footer with total count
            footer = f"\nTotal links found: {len(link_texts)}"
            print(footer)
            output_file.write(footer)
    else:
        # Just print to console if no output file specified
        for i, text in enumerate(link_texts, 1):
            print(f"{i}. {text}")
        print(f"\nTotal links found: {len(link_texts)}")
    
    return link_texts

# Example usage
if __name__ == "__main__":
    html_file_path = "bls-index.htm"  # Replace with your HTML file path
    output_file_path = "job_pursuits.txt"  # Replace with desired output file path
    
    texts = extract_link_texts(html_file_path, output_file_path)