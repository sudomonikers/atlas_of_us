#!/usr/bin/env python3
import sys
import requests
from bs4 import BeautifulSoup

def scrape_site(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors
    except requests.RequestException as e:
        print(f"Error fetching the website: {e}")
        sys.exit(1)
    
    # Parse the HTML content using BeautifulSoup:
    soup = BeautifulSoup(response.text, 'html.parser')
    return soup

def main():
    if len(sys.argv) != 2:
        print("Usage: python scrape_site.py <website_url>")
        sys.exit(1)
    
    url = sys.argv[1]
    soup = scrape_site(url)
    
    # Example: Print the page title:
    title_tag = soup.find('title')
    if title_tag:
        print(f"Title of the website: {title_tag.get_text()}")
    else:
        print("No title found on the website.")
    
if __name__ == '__main__':
    main()