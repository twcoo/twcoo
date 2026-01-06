# TCP Timeout Between Containers in Docker Swarm

I recently encountered an issue at work where an orchestration container makes a long-running request to an API container. The request takes around **22 minutes** to complete, but the orchestration container request would get stuck until it eventually timed out. When checking the API container logs, I could see that the request was actually finishing, so I knew the API wasn’t the problem.

To investigate, I tried running `curl` inside the orchestration container and also wrote a `Python` script to perform the same request. For some reason, the `curl` command worked, but the Python script did not.

After some searching, I found this forum thread:
[https://forums.docker.com/t/tcp-timeout-that-occurs-only-in-docker-swarm-not-simple-docker-run/58179](https://forums.docker.com/t/tcp-timeout-that-occurs-only-in-docker-swarm-not-simple-docker-run/58179)

According to the discussion there, this behavior is expected. Docker Swarm uses **IPVS** for load balancing and high availability, and it enforces a connection disruption timeout. This can break long-running TCP connections between containers.

The fix is to use `dnsrr` for services that need to maintain long-lived network connections:

```yaml
services:
  sample_service:
    image: sample_image
    deploy:
      endpoint_mode: dnsrr
```

This disables the VIP load balancer and allows direct container-to-container communication, avoiding the IPVS timeout.
