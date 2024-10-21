# User Manual:

## Installation

The program can be downloaded from github under releases: [https://github.com/Sydarkivera/DBAnalyzer/releases](https://github.com/Sydarkivera/DBAnalyzer/releases). The latest version will always appear on top for both Windows and MacOS.

THe application is run by starting the .exe file.

## How to add a database

When the application is started the first time on a new computer the initial list will be empty. That is the list of your added databases.

You can add a new database by pressing the "New Database Connection" button in the top right corner of the applicaiton. A form will open where you can enter the connection information.

* **Server Label**: This is a name that you choose for the connection.
* **Server Address**: The IP or domain name for the server containing the database.
* **Database**: The name of the database inside the server. A single server may contain multiple databases, but the application will only work with one of them at a time.
* **Username**: The username of a user on the SQL server that has access to the specified database.
* **Password**: The password to the above user.
* **DBMS**: The type of database that is being added. It is important tha the correct DBMS is defined for the queries to work properly.

It is recommended that you press the test button before saving. The application will try to connect to the database with the given credentials and verify that what you have entered is correct.

Finally please remember to save your changes by pressing save.

## Database overview

When you have added a database connection you can click it to navigate to the overview of the contents of the database. In the top section you can see a summary of the database by expanding "Database info".

Below is a list describing all the tables in the database. They are sorted by number of rows with the largest table on top. If you want more information about a specific table you can simple click on it to navigate to the table view. In the table view the user can see all the columns that are present in the table. The user can alswo browse the content of the table, with the first 30 rows visible from the start. More rows can be viewed by pressing "Next rows" or "Previous rows".

The search field above the list of tables can be used to search for a table or a column. You simply search for the term you want and the results will be updated instantly.

## Analysis

The analysis consists of three steps. The first step is the most time consuming and is required for the next steps. It is recommended to run this ahead of time since it can easily take a day to complete. The reason for this step to be so time consuming is that it fetches a lot of information from the database. First it fetches all informations of all the columns in every table. Then it checks if any of these columns are empty (meaning they only contain null or 0 or an empty string). Then it identifies all the possible candidate keys in the database. This requires a lot of time consuming queries. The result is then used in the final fetching step, identifying all the possible foreign keys. If you want to know more about the algorithms for finding candidate and foreign keys please refer to [This master thesis](https://github.com/Sydarkivera/DBAnalyzer/blob/master/master_thesis.pdf).

When this step is complete the next step is unlocked whish is executed almost instantly. This uses the now available data to draw conclusions about what tables the user should be able to discard. The results are presented under "Verify tables". 

## Verifying tables

THe verify tables page contains thress sections. The first seciton highlights tables that is recommended that the user removes based on their size. It does explain why you likely should remove the specific table.

The next sections highlights tables that don't have any relation to any other table. These tables usally don't contain information that are worth saving, but it still requires the user to verify the algorithms assumption.

The last step suggests tables that has relations but only relate to each other. In a well structured database the important information is linked togheter. At times there exists smaller groups of tables that relate to eachother, but not to the larger group. These groups are usally part of some unused part of the application and usally don't contain any important information.

## Selecting the tables worth saving

To the left of every tablename a small checkbox can be seen. This checkbox specifies if the tables is set to be saved or if it can be discarded. By default it is checked and yellow. Since it is checked it is marked to be saved, but the yellow color signifies that the user has not made a decision about that specific table yet. If a yellow checkbox is clicked it turns green. The green checkbox is still checked which marks it to be saved, and the green color signifies that it is marked by the user. Lastly if the user clicks on a green checkbox it turns red and empty. This marks it not to be saved. The application will set the checkbox as red **only** if the table don't have any rows. Otherwise it is a way for the user to mark tables that are verified not to be saved.

On the overview of the database there is a row named "Tables that are marked to be saved" where a comma separated list of all tables that should be saved. This list can be used by other programs to archive only the relevant tables.
