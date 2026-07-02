# Web Crawler

## 1. Deduplication - Bloom Filter

```text
Tracks visited URLs using fixed-sized bit array + hash function instead of storing actual URLs.
False negative impossible - a visited URL is always detected, solving infinite loops.
False positives possible but rare and tunable - occasionally skips an unvisited page, acceptable at scale.
Uses a fraction of the memory of storing URLs - critical at billions pages.
```

## 2. URL Frontier - Per-Domain Queues

```text
One separate queue per domain (not one FIFO queue) prevents any single domain from flooding workers.
Workers round-robin across domain queues for fair distribution.
Each domain has it's own politeness delay - worker checks last crawled timestamp before pulling domain's queue again.
Respects robots.txt crawl-delay directives per domain.
Queue dequeuing is atomic - eliminates race conditions between parallel workers.
```

## 3. Page Processing - Fetch & Extract

```text
Workers are stateless and embarrasingly parallel - just add more to crawl faster.
Each worker: pull URL -> fetch HTML -> extract all <a href> links -> push new URLs to domain queues -> extract page content -> store + index.
Follows links to any domain (not just the source domain) for full web coverage.
```

## 4. Storage & Indexing

```text
Storage - raw/cleaned page content saved to durable blob storage (e.g. S3).
Inverted index - maps word -> list of pages containing that word. Enables millisecond search across billions of pages.
Search ranking combines two signals:
* TF-IDF - how relevant is this page to the search term?
* PageRank - how authoritative is this page based on inbound links?
```

## 5. Freshness - Adaptive Crawl Scheduling

```text
Not all pages need equal re-crawl frequency - news sites change daily, docs rarely change.
Observe change history is the most trusted signal - track how often a page actually changed across past crawls.
Last-Modified header - medium trust, server-provided hint.
sitemap.xml changefreq - low trust, self-declared and easily abused by spammy sites.
Schedule adapts over time: pages that changed often get crawled often, static pages rarely.
```

## 6. Scale - Horizontal Distribution

```text
Fetch + extraction workers are stateless -> horizontally scale to thousands of machines easily.
Domain queues are shared across all workers via distributed queue (Kafka/RabbitMQ).
Atomic dequeuing prevents race conditions - once a worker claims a URL, no other worker can.
Single machine at 1 page/sec = 1,500 years to crawl the web. Thousands of parallel workers bring this down to days.
```
