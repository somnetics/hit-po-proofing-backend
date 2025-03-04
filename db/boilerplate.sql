-- MySQL dump 10.13  Distrib 8.0.37, for Linux (x86_64)
--
-- Host: localhost    Database: boilerplate
-- ------------------------------------------------------
-- Server version	8.0.37-0ubuntu0.22.04.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` mediumint unsigned NOT NULL AUTO_INCREMENT,
  `rolename` char(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `privileges` json DEFAULT NULL,
  `status` char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Active',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (1,'User','{\"Admin\": {\"IAM\": {\"Role\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}, \"User\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}}, \"Settings\": {\"Translate\": {\"Read\": true, \"Update\": true}, \"Configuration\": {\"Read\": true, \"Update\": true}}}, \"Tasks\": {\"MyTask\": {\"A\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}}}, \"Modeler\": {}}','Active',0),(3,'Administrator','{\"Admin\": {\"IAM\": {\"Role\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}, \"User\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}}, \"Settings\": {\"Translate\": {\"Read\": true, \"Update\": true}, \"Configuration\": {\"Read\": true, \"Update\": true}}}, \"Tasks\": {\"Tasks\": {\"All Tasks\": {\"Read\": true}, \"Open Tasks\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}, \"Completed Tasks\": {\"Read\": true}, \"Unassigned Tasks\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}}, \"MyTask\": {\"A\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}}, \"MyTasks\": {\"All Tasks\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}, \"Open Tasks\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}}, \"My Tasks\": {\"All Tasks\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}, \"Open Tasks\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}, \"Completed Tasks\": {\"Read\": true, \"Create\": false, \"Delete\": false, \"Update\": false}, \"Unassigned Tasks\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}}}, \"Modeler\": {\"Modeler\": {\"Flow\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}, \"Form\": {\"Read\": true, \"Create\": true, \"Delete\": true, \"Update\": true}}}}','Active',0);
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` char(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `fullname` char(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` char(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` char(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `phone` char(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `role` mediumint unsigned DEFAULT NULL,
  `is_super_user` tinyint unsigned NOT NULL DEFAULT '0',
  `status` char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Active',
  `deleted` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_role_FK` (`role`),
  CONSTRAINT `user_role_FK` FOREIGN KEY (`role`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('9264bd4b-fd06-11ec-9d1f-8afbe0b093da','admin','Admin','U2FsdGVkX1/emjKCzHmq9azxN7SOXnC9++FDhOfUwL8=','das.susanta1979@gmail.com','9123632180',3,0,'Active',0),('9264dcd7-fd06-11ec-9d1f-8afbe0b093da','suadmin','Super Administrator','U2FsdGVkX19Gft/NBwC29faITQpccN4Mlha8sheUz2E=','susanta.das@somnetics.in','9123632180',3,1,'Active',0);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'boilerplate'
--

--
-- Dumping routines for database 'boilerplate'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-11-26 15:35:09