# Lifestyle Survey Calculation

This document explains how the Lifestyle Survey estimates a user's carbon footprint.

The survey collects three groups of answers:

- Transport habits
- Food and diet habits
- Home electricity usage

The backend calculates one emission value for each group, then adds them together.

```text
totalEmission = transportEmission + foodEmission + energyEmission
```

## Survey Flow

The frontend survey page is:

```text
frontend/src/pages/LifestyleSurvey.js
```

When the user clicks **Calculate footprint**, the frontend sends the survey answers to:

```text
POST /api/survey
```

The backend controller is:

```text
backend/src/main/java/com/carbon/carbontracker/controller/SurveyController.java
```

The main calculation logic is:

```text
backend/src/main/java/com/carbon/carbontracker/service/CarbonCalculationService.java
```

After calculating the values, the backend saves:

- A survey record in the `surveys` table
- A carbon log record in the `carbon_logs` table

## Transport Calculation

Transport emissions are calculated from the user's average daily distance and transport mode.

```text
transportEmission = distancePerDay * transportFactor
```

### Transport Factors

| Transport mode | Factor |
| --- | ---: |
| Car with petrol | Admin setting `carPetrolFactor`, default `0.21` |
| Car with diesel | Admin setting `carDieselFactor`, default `0.18` |
| Car with electric fuel | Admin setting `carElectricFactor`, default `0.05` |
| Public transport | Admin setting `transportFactor`, default `0.12` |
| Bike | Admin setting `bikeFactor`, default `0.024` |
| Walk | 0 |
| Work from home | 0 |

Example:

```text
transportMode = CAR
fuelType = PETROL
distancePerDay = 10

transportEmission = 10 * 0.21
transportEmission = 2.1
```

## Food Calculation

Food emissions are calculated from the user's diet type and meals per day.

```text
foodEmission = dietFactor * mealsPerDay
```

### Diet Factors

| Diet type | Factor |
| --- | ---: |
| Vegetarian (`VEG`) | Admin setting `foodVegFactor`, default `1.5` |
| Non-vegetarian (`NON_VEG`) | Admin setting `foodNonVegFactor`, default `3.3` |
| Vegan (`VEGAN`) | `foodVegFactor * 0.8` |

The current frontend only sends:

- `VEG` for vegetarian
- `NON_VEG` for non-vegetarian

Example:

```text
dietType = NON_VEG
mealsPerDay = 3

foodEmission = 3.3 * 3
foodEmission = 9.9
```

## Energy Calculation

The frontend asks the user for monthly electricity usage in kWh.

Before sending the value to the backend, the frontend converts it to a daily value:

```text
dailyElectricity = monthlyElectricityKwh / daysInCurrentMonth
```

The backend then calculates energy emissions:

```text
energyEmission = dailyElectricity * electricityFactor
```

The default `electricityFactor` is `0.82`.

If the user selects renewable or green energy, the backend reduces the energy emission by 40%.

```text
energyEmission = energyEmission * 0.6
```

Example:

```text
monthlyElectricityKwh = 240
daysInCurrentMonth = 30
renewable = false

dailyElectricity = 240 / 30
dailyElectricity = 8

energyEmission = 8 * 0.82
energyEmission = 6.56
```

Renewable example:

```text
energyEmission = 6.56 * 0.6
energyEmission = 3.936
```

## Full Example

User answers:

```text
transportMode = CAR
fuelType = PETROL
distancePerDay = 10
dietType = NON_VEG
mealsPerDay = 3
monthlyElectricityKwh = 240
daysInCurrentMonth = 30
renewable = false
```

Calculation:

```text
transportEmission = 10 * 0.21 = 2.1
foodEmission = 3.3 * 3 = 9.9
energyEmission = (240 / 30) * 0.82 = 6.56

totalEmission = 2.1 + 9.9 + 6.56
totalEmission = 18.56
```

So the saved carbon footprint value for this survey would be:

```text
18.56
```

## Admin Settings Used

Some factors can be changed from admin settings. Their default values are initialized in:

```text
backend/src/main/java/com/carbon/carbontracker/service/AdminSettingsStoreService.java
```

Default settings:

| Setting key | Default value |
| --- | ---: |
| `electricityFactor` | 0.82 |
| `carPetrolFactor` | 0.21 |
| `carDieselFactor` | 0.18 |
| `carElectricFactor` | 0.05 |
| `transportFactor` | 0.12 |
| `bikeFactor` | 0.024 |
| `foodVegFactor` | 1.5 |
| `foodNonVegFactor` | 3.3 |

## Important Notes

- The survey result is an estimate, not an exact scientific audit.
- The frontend currently sends daily electricity usage to the backend, even though the form label asks for monthly electricity.
- The backend stores the calculated result as a carbon log so the dashboard can show footprint history.
