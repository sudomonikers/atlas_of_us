To start the DB locally, download postgressql for whatever OS you are working on.

Connect via the postgres cli

```
brew services start postgresql@16
```

Then create a DB:
```
psql -d postgres
CREATE DATABASE atlas_of_us;
```

\q to quit

connect via any gui at localhost:5432
