# How To Size A Circuit Breaker

## Formula

Circuit Breaker = `Current` x `1.25 (Safety factor)`

## Sizing a circuit breaker for solar panel to MPPT connection

> Get the value of `Isc (Short Circuit Current)` from the solar panel specs
>
> Circuit Breaker = (Isc) 9.37A x 1.25 x 1.25 = 14.6A
>
> Round of 14.6A to 15A
>
> We need a 16A DC circuit breaker

## Sizing a circuit breaker for MPPT to battery bank connection

> Example 1
>
> Current = `Total Array Wattage` / `Battery Bank Nominal Voltage`
>
> Current = 400W Solar Panel / 12.8V Battery = 31.2A
>
> Circuit Breaker = 31.2A x 1.25 = 39A
>
> We need a 40A DC circuit breaker

> Example 2
>
> Get the `Rated charging current` of the MPPT
>
> Circuit Breaker = (Rated charging current) 80A x 1.25 = 100A
>
> We need a 100A DC circuit breaker

## Sizing a circuit breaker for battery bank to inverter connection

> Current = `Inverter Wattage` / `Battery Bank Nominal Voltage`
>
> Current = 1000W / 12.8V = 78.1 A
>
> Circuit Breaker = 78.1A x 1.25 = 97A
>
> We need a 100A DC circuit breaker

## Sizing a circuit breaker for inverter to outlet connection

> Current = (`Load Percent` x `Inverter Wattage`) / 220V
>
> Current = (70% x 1000W) / 220V = 3.18A
>
> Circuit Breaker = 3.18A x 1.25 = 3.9A
>
> We can use a 6A AC circuit breaker
