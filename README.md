# NodeJS Boilerplate
i-doc is a document management system built on [seamless application platform v3](https://github.com/somnetics/nodejs-boilerplate). With i-doc, a user can store, manage and organise content.

## Prerequisites
* OS Ubuntu 22.04 LTS
* NodeJs 18.9.1
* NPM 10.2.4
* PM2 5.3.1
* MySQL 8.0

## Git Clone
To clone this application use the below commands

```bash
git clone https://github.com/somnetics/nodejs-boilerplate.git
cd nodejs-boilerplate
npm install
```

## Important Files & Folders
```bash
├── app					# Files related to Application
│  ├── routes				# Router Files (Javascript files)    
│  └── views				# View folder (HTML files)
│    └── partials			# Partial view path (HTML files)
├── cache				# App cache folder
├── config				# App config folder
│  ├── config.js			# App config file
│  ├── events.js			# App events file
│  ├── middleware.js			# App middleware file
│  ├── privilege.js			# App privilege file
│  └── scheduler.js			# App scheduler file
├── db					# App database folder
├── libs				# App library folder
├── locales				# App i18n folder
├── public				# Public files (Images/CSS/JS)    
├── session				# App session folder
├── upload				# App upload folder
├── app.js				# App entry point file
├── app.json				# PM2 startup file (production only)
└── package.json			# NPM package file
```

## MySQL Commands
Login to mysql server as root user use the below command
```bash
mysql -u root -p
```

To create database use the below command
```bash
mysql> CREATE database `boilerplate`;
mysql> CREATE USER 'boilerplate'@'localhost' IDENTIFIED BY '72CnbwjM9JtjXFcS';
mysql> GRANT ALL PRIVILEGES ON `boilerplate`.* TO 'boilerplate'@'localhost';
```

To import database use the below command
```bash
mysql -u root -p boilerplate < ./db/boilerplate.sql
```

## App Config
Modify the config file as required, which can be found in `boilerplate/config/config.js`

## PM2 Commands
To start this application as daemon service use the below commands
```bash
cd boilerplate
pm2 start npm --name "boilerplate" -- start
```

To show application logs use the below command
```bash
pm2 logs boilerplate
```

To `stop|start|restart` the application use the below command
```bash
pm2 <action> boilerplate
```

## Launch Application
To start this application follow the given steps
* Click this link http://localhost:5000 to open in the browser
 
User login details are as follows
* Username: admin
* Password: password

## Git Push
Please, use the below command to commit the changes to the git repository
```bash
git add <filename>
git commit -m "<Valid Commit Message>"
git push origin <branchname>
```

## MySQL Export Commands
To export database use the below command
```bash
mysqldump -u root -p --routines --events boilerplate > ./db/boilerplate.sql
```