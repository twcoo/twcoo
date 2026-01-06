# How To Wire Size

## Formula

`(Amperes × Wire Length) / (Voltage × % Voltage Drop)`

## Wire Size Chart

![Wire Size Chart](/wire_size_chart.png)

## Sizing a wire for solar panel to MPPT connection

> Get the solar panel `Imp` spec for `Ampere` value
>
> Get the solar panel `Vmp` spec for `Voltage` value
>
> If we have 5 solar panels in series
>
> 22.48V Vmp x 5 = 112.4V
> 8.90A Imp (Ampere stay the same in series)
>
> (8.90A x 49.21ft) / (112.4V x 2) = 437.9 / 224.8 = `1.9 VDI`
>
> Base from the wire size chart we can use `10 AWG`

## Sizing a wire for MPPT to battery bank connection

> Get the maximum charging current of the MPPT for the `Ampere` value
>
> Get the voltage of the battery for the `Voltage` value
>
> (100A x 3ft) / (12.8V x % 2) = 300 / 25.6 = `11.7 VDI`
>
> Base from the wire size chart we can use `6 AWG`

## Sizing a wire for battery bank to inverter connection

> Get the `Current` of the inverter for the `Ampere` value
>
> Current = `Inverter Power` / `Voltage`
>
> Current = 1000W / 12.8V = 78.1A
>
> (78.1A x 3ft) / (12.8V x % 2) = 234.3 / 25.6 = `9.15 VDI`
>
> Base from the wire size chart we can use `6 AWG`
