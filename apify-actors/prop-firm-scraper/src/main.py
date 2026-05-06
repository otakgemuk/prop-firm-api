#!/usr/bin/env python3
"""
Apify actor for scraping prop firm pricing pages
"""

from apify import Actor
from crawlee.crawlers import BeautifulSoupCrawler, BeautifulSoupCrawlingContext
import re

async def main() -> None:
    async with Actor:
        Actor.log.info("Starting prop firm pricing scraper...")
        
        # Get input
        actor_input = await Actor.get_input() or {}
        start_urls = actor_input.get('startUrls', [{'url': 'https://example.com/pricing'}])
        max_depth = actor_input.get('maxDepth', 1)
        
        # Initialize crawler
        crawler = BeautifulSoupCrawler(max_requests_per_crawl=50)
        
        @crawler.router.default_handler
        async def request_handler(context: BeautifulSoupCrawlingContext) -> None:
            url = context.request.url
            soup = context.soup
            Actor.log.info(f'Scraping {url}...')
            
            # Common pricing patterns (adjust selectors for each firm)
            pricing_data = {
                'url': url,
                'scraped_at': context.request.timestamp,
                'plans': []
            }
            
            # Look for pricing tables
            tables = soup.find_all('table')
            price_cards = soup.find_all(class_=re.compile(r'price|card|plan|package', re.I))
            
            # Extract prices from tables
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    cell_texts = [cell.get_text(strip=True) for cell in cells]
                    
                    # Look for dollar amounts
                    for text in cell_texts:
                        prices = re.findall(r'\$(\d+(?:\.\d{2})?)', text)
                        if prices:
                            pricing_data['plans'].append({
                                'description': ' '.join(cell_texts),
                                'price': float(prices[0])
                            })
            
            # Extract from price cards
            for card in price_cards:
                card_text = card.get_text(strip=True)
                prices = re.findall(r'\$(\d+(?:\.\d{2})?)', card_text)
                
                if prices:
                    # Try to find account size
                    size_match = re.search(r'(\d+)[kK]', card_text)
                    account_size = f"{size_match.group(1)}k" if size_match else None
                    
                    # Try to find discount
                    discount_match = re.search(r'(\d+)%', card_text)
                    discount = int(discount_match.group(1)) if discount_match else None
                    
                    pricing_data['plans'].append({
                        'account_size': account_size,
                        'price': float(prices[0]),
                        'discount_percent': discount,
                        'description': card_text[:200]  # Truncate
                    })
            
            # Push data to dataset
            if pricing_data['plans']:
                await context.push_data(pricing_data)
                Actor.log.info(f'Found {len(pricing_data["plans"])} pricing plans')
            else:
                Actor.log.warning(f'No pricing data found at {url}')
        
        # Run the crawler
        await crawler.run([url['url'] for url in start_urls])
        
        Actor.log.info('Scraping completed successfully')

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())