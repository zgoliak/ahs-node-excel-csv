# ahs-node-excel-csv

## Proxy between Disney|HealthFirst and Salesforce

### Purpose

Five9 will hit this at example.com/api?param=example with parameters. This passes to an inbound REST Apex method in Salesforce and passes the parameters as it's given.

If more params need added: five9 will need to add them to the outbound parameters and Salesforce's Apex method will need the same param names added to the Apex methods arguments but this should be able to stay as is.

If param names change: The params must line up (case sensitive) to Apex so the Apex method's argument names match the parameter names given so both will need to be adjusted but this should be able to stay as is.

---

## Normal Setup

### Install dependencies

```npm install```

### run for prod

```npm start```

### run for testing in a sandbox

```npm test```

---

## Docker Setup

### docker build

```npm run build-dock```

### docker run

```npm run start-dock```

In the [Dockerfile], there's a CMD commented that uses the ```npm start``` command

---

## Salesforce Info

The ```npm test``` command is will dictate it to use test.salesforce.com and not login.salesforce.com for logging into Salesforce.

---

- [Zakee Goliak](mailto:zakee.goliak@coastalcloud.us)