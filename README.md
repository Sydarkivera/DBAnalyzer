# DBAnalyzer

This project is developed as a tool for analysing a database so that it can be extracted and archived. It is currently in the prototype stage where it does work, but it is missing a lot of features that would be useful.

The tool works by first indexing the database schema. If there are no foreign keys present, an algorithm is executed that finds all possible candidate keys and foreign keys. These relations will then be used in an automated analysis where a set of patterns is used to determine if a table is worth saving or not. The result are then presented to the user so that an person can verify the result of the algorithm.

## Development

Run the project in development by first installing the dependencies with `npm install`

Then you need to start react with `npm run dev:react`
And in another window you start electron with `npm run dev:electron`

## User guide
The user guide is located at [User guide](https://github.com/Sydarkivera/DBAnalyzer/userGuide.md).