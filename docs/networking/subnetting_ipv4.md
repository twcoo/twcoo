# Subnetting IPv4

## What is the subnet mask for the CIDR `/26`?

1. Convert `/26` to a binary

```bash
11111111.11111111.11111111.11000000
```

2. Convert the binary to decimal

> The binary table below will help us find the decimal value <br>
> by adding the columns with a value of `1`.

> First octet
>
> | 128 | 64  | 32  | 16  | 8   | 4   | 2   | 1   |
> | --- | --- | --- | --- | --- | --- | --- | --- |
> | 1   | 1   | 1   | 1   | 1   | 1   | 1   | 1   |
>
> 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = `255`

> Second octet
>
> | 128 | 64  | 32  | 16  | 8   | 4   | 2   | 1   |
> | --- | --- | --- | --- | --- | --- | --- | --- |
> | 1   | 1   | 1   | 1   | 1   | 1   | 1   | 1   |
>
> 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = `255`

> Third octet
>
> | 128 | 64  | 32  | 16  | 8   | 4   | 2   | 1   |
> | --- | --- | --- | --- | --- | --- | --- | --- |
> | 1   | 1   | 1   | 1   | 1   | 1   | 1   | 1   |
>
> 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = `255`

> Fourth octet
>
> | 128 | 64  | 32  | 16  | 8   | 4   | 2   | 1   |
> | --- | --- | --- | --- | --- | --- | --- | --- |
> | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
>
> 128 + 64 = `192`

The subnet mask is `255.255.255.192`

## How to convert decimal subnet mask `255.255.255.192` to binary

> We will use repeated division by 2 to find the binary equivalent of each octet.

Let's take the last octet `192` as an example:

192 / 2 = 96 remainder 0  
96 / 2 = 48 remainder 0  
48 / 2 = 24 remainder 0  
24 / 2 = 12 remainder 0  
12 / 2 = 6 remainder 0  
6 / 2 = 3 remainder 0  
3 / 2 = 1 remainder 1  
1 / 2 = 0 remainder 1

Reading the remainders **from bottom to top**, we get:

`11000000`

So, the full binary form of `255.255.255.192` is:

`11111111.11111111.11111111.11000000`

## How to calculate the number of usable host ID's in subnet `255.255.255.192`?

> We can use the formula h=2<sup>x</sup>-2

The `x` stand for the number of zeros on the subnet mask

`255.255.255.192` is `11111111.11111111.11111111.11000000` in binary.

> h = 2 <sup>6</sup> - 2
>
> There are `6` zeros in the binary subnet mask

> = 64 - 2
>
> The first IP is reserve for the network ID.
>
> The last IP is reserve for the broadcast ID.
>
> That is why we need to subtract `2`.

> = 62

We have `62` available host ID's.

## How to create three separate networks or subnet under the network ID `192.168.4.0/24`?

1. Create a [sunny table](https://www.youtube.com/watch?v=ecCuyq-Wprc).

   | Subnet      | 1   | 2   | 4   | 8   | 16  | 32  | 64  | 128 | 256 |
   | ----------- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
   | Host        | 256 | 128 | 64  | 32  | 16  | 8   | 4   | 2   | 1   |
   | Subnet Mask | /24 | /25 | /26 | /27 | /28 | /29 | /30 | /31 | /32 |

2. We are required to create `3` subnets, and based from
   the sunny table `Subnet` row there is no `three` but we
   could use `4` since it should be able to contain the `three` subnets.

3. Now that we choosed column `4`, we can ignore all the remaining columns.

   | 4 - Number of subnets.                                                                        |
   | --------------------------------------------------------------------------------------------- |
   | 64 - Each 4 subnets will have a total of 64 host ID's, including network ID and broadcast ID. |
   | /26 - The subnet mask of the 4 subnets.                                                       |

4. Let's start listing the information of the `four` subnets.

| Network ID                                                                                                                       | Subnet Mask                                           | Host ID Range                                                                           | # of Usable Host                                                         | Broadcast ID                                                              |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 192.168.4.`0` - The original network ID is always the first network ID.                                                          | /26 - All the networks subnet masks will be the same. | 192.168.4.1 - 192.168.4.62 (The host ID's between the network ID and the broadcast ID.) | `62` - Number of total host ID's `64` - Network ID and Broadcast ID `2`. | 192.168.4.63 - We got this from the previous value of the row network ID. |
| 192.168.4.`64` - We got this by just adding number of host ID's `64` to the value after the subnet mask of the first network ID. | /26 - Same from the above                             | 192.168.4.65 - 192.168.4.126                                                            | 62 - Same from the above                                                 | 192.168.4.127 - Same from the above                                       |
| 192.168.4.`128` - Same from the above just by adding `64` on the previous value of the row after the subnet mask.                | /26 - Same from the above                             | 192.168.4.129 - 192.168.4.190                                                           | 62 - Same from the above                                                 | 192.168.4.191 - Same from the above                                       |
| 192.168.4.`192` - Same from the above too `128` + `64` = `192`.                                                                  | /26 - Same from the above                             | 192.168.4.193 - 192.168.4.254                                                           | 62 - Same from the above                                                 | 192.168.4.255 - Same from the above                                       |

5. Now you can use any of these `4` subnets on the required `3` subnets. One subnet is wasted but that is the disadvantage of subnetting.
