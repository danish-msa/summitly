# How to Search for Listings with Open Houses (Repliers)

One of the common questions we receive is how to find listings with open houses using our APIs. Repliers offers parameters that allow you to filter listings by open house dates. Here's how you can use the **minOpenHouseDate** and **maxOpenHouseDate** parameters to find the listings you need.

## Finding Open Houses for This Week

If you want to find open houses scheduled for this week, you can set the date range by passing a `minOpenHouseDate` and `maxOpenHouseDate`. For example, assuming today is January 1, 2024, and you want to find open houses scheduled between January 1 and January 7:

```
https://api.repliers.io/listings?minOpenHouseDate=2024-01-01&maxOpenHouseDate=2024-01-07
```

This query will return all listings that have an open house scheduled within the specified date range.

## Finding Open Houses for Today

If you're interested in finding listings with open houses scheduled for today, you can pass the same date for both `minOpenHouseDate` and `maxOpenHouseDate`:

```
https://api.repliers.io/listings?minOpenHouseDate=2024-01-01&maxOpenHouseDate=2024-01-01
```

This will return listings with open houses happening on January 1, 2024.

## Finding Future Open Houses

To find listings that have open houses scheduled for any date in the future, simply pass a `minOpenHouseDate` without specifying a `maxOpenHouseDate`. For example, if today is January 1, 2024, and you want to find all future open houses:

```
https://api.repliers.io/listings?minOpenHouseDate=2024-01-01
```

This query will return all listings with open houses happening on or after January 1, 2024.

## Usage in this project

- **ListingsParams** in `services/listings.ts` supports `minOpenHouseDate` and `maxOpenHouseDate` (format: `YYYY-MM-DD`).
- **OpenHousesSection** (Buy page) uses `minOpenHouseDate` set to today’s date to fetch upcoming open houses from the Repliers API.

Always format dates as **YYYY-MM-DD** when making API requests.
