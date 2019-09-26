USE management;

CREATE TABLE `Cart` (
	`c_id` INT(11) NOT NULL AUTO_INCREMENT,
	`c_amount` INT(11) NOT NULL,
	`c_u_id` INT(11) NOT NULL,
	`c_p_id` INT(11) NOT NULL,
	PRIMARY KEY (`c_id`),
	INDEX `c_p_id` (`c_p_id`),
	INDEX `c_u_id` (`c_u_id`),
	CONSTRAINT `Cart_ibfk_1` FOREIGN KEY (`c_p_id`) REFERENCES `Product` (`p_id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `Cart_ibfk_2` FOREIGN KEY (`c_u_id`) REFERENCES `User` (`u_id`) ON UPDATE CASCADE ON DELETE CASCADE
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=6

CREATE TABLE `Category` (
	`cg_id` INT(11) NOT NULL AUTO_INCREMENT,
	`cg_name` VARCHAR(64) NOT NULL,
	PRIMARY KEY (`cg_id`),
	UNIQUE INDEX `cg_unique` (`cg_name`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=104

CREATE TABLE `Orders` (
	`o_id` INT(11) NOT NULL AUTO_INCREMENT,
	`o_amount` INT(11) NOT NULL,
	`o_status` INT(11) NOT NULL DEFAULT '1',
	`o_p_id` INT(11) NOT NULL,
	`o_u_id` INT(11) NOT NULL,
	PRIMARY KEY (`o_id`),
	INDEX `o_p_id` (`o_p_id`),
	INDEX `o_u_id` (`o_u_id`),
	CONSTRAINT `Orders_ibfk_1` FOREIGN KEY (`o_p_id`) REFERENCES `Product` (`p_id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `Orders_ibfk_2` FOREIGN KEY (`o_u_id`) REFERENCES `User` (`u_id`) ON UPDATE CASCADE ON DELETE CASCADE
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=12
;

CREATE TABLE `Photo` (
	`pi_id` INT(11) NOT NULL AUTO_INCREMENT,
	`pi_name` VARCHAR(50) NOT NULL,
	`pi_caption` VARCHAR(50) NULL DEFAULT NULL,
	`pi_type` VARCHAR(50) NOT NULL,
	`pi_index` INT(7) NOT NULL,
	`pi_size` INT(11) NOT NULL,
	`pi_create_by` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`pi_p_id` INT(11) NULL DEFAULT NULL,
	PRIMARY KEY (`pi_id`),
	INDEX `pi_p_id` (`pi_p_id`),
	CONSTRAINT `pi_p_id` FOREIGN KEY (`pi_p_id`) REFERENCES `Product` (`p_id`) ON UPDATE CASCADE ON DELETE CASCADE
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=84
;

CREATE TABLE `Product` (
	`p_id` INT(11) NOT NULL AUTO_INCREMENT,
	`p_name` VARCHAR(50) NOT NULL,
	`p_description` VARCHAR(64) NULL DEFAULT NULL,
	`p_price` INT(11) NULL DEFAULT NULL,
	`p_status` INT(11) NULL DEFAULT '0',
	`p_amount` INT(11) NULL DEFAULT NULL,
	`p_cg_id` INT(11) NULL DEFAULT NULL,
	PRIMARY KEY (`p_id`),
	UNIQUE INDEX `p_name` (`p_name`),
	INDEX `p_cg_id` (`p_cg_id`),
	CONSTRAINT `Product_ibfk_1` FOREIGN KEY (`p_cg_id`) REFERENCES `Category` (`cg_id`) ON UPDATE CASCADE ON DELETE CASCADE
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=46
;

CREATE TABLE `User` (
	`u_id` INT(11) NOT NULL AUTO_INCREMENT,
	`u_name` VARCHAR(64) NOT NULL,
	`u_email` VARCHAR(64) NOT NULL,
	`u_password` VARCHAR(64) NOT NULL,
	`u_status` INT(11) NOT NULL DEFAULT '1',
	`u_address` VARCHAR(64) NOT NULL,
	`u_phone` VARCHAR(64) NOT NULL,
	PRIMARY KEY (`u_id`),
	UNIQUE INDEX `unique_id` (`u_name`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=25
;
