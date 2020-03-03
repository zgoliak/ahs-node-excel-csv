# ahs-node-excel-csv

## Proxy between Disney|HealthFirst and Salesforce

### Purpose

This tool will hit Salesforce to pull data using parameters. This will adapt data to the necessary rules of Disney or FirstHealth using parameters. This will generate files and transfer to SFTP using parameters.

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
