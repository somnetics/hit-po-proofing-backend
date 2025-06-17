// import express
import express, { Request, Response } from "express";

// init express router
const router = express.Router();

// import moment module
import moment from "moment";

// import mysql class
import MySQL from "../libs/mysql";
import { machine } from "os";

// get mysql instance
const mysql = new MySQL();

// define search route
router.get("/summary", async (req: Request, res: Response) => {
  try {
    // get issue count
    const issueData: any = {};

    // get appointment consultations
    const issues = await mysql
      .raw(`SELECT COUNT(id) AS cnt, completed FROM issue GROUP BY completed`);

    // set completed data
    issues.results.filter((issue: any) => issue.completed == 1).forEach((issue: any) => { issueData.Completed = issue.cnt });

    // set pending data
    issues.results.filter((issue: any) => issue.completed == 0).forEach((issue: any) => { issueData.Pending = issue.cnt });

    // // get age group    
    // const ageGroupData: any = { Male: [], Female: [], Others: [] };

    // // get age group 0-18
    // let data = await mysql
    //   .raw(`SELECT COUNT(id) AS cnt, gender FROM patient WHERE deleted = 0 AND age >= 0 AND age < 18 GROUP BY gender`);

    // // loop gender
    // ["Male", "Female", "Others"].forEach((gender: string) => {
    //   // get count
    //   const cnt = data.results.filter((value: any) => value.gender == gender);

    //   // set value
    //   if (cnt.length) ageGroupData[gender].push(cnt[0].cnt);
    // });

    // // get age group 18-45
    // data = await mysql
    //   .raw(`SELECT COUNT(id) AS cnt, gender FROM patient WHERE deleted = 0 AND age >= 18 AND age < 45 GROUP BY gender`);

    // // loop gender
    // ["Male", "Female", "Others"].forEach((gender: string) => {
    //   // get count
    //   const cnt = data.results.filter((value: any) => value.gender == gender);

    //   // set value
    //   if (cnt.length) ageGroupData[gender].push(cnt[0].cnt);
    // });

    // // get age group 45-60
    // data = await mysql
    //   .raw(`SELECT COUNT(id) AS cnt, gender FROM patient WHERE deleted = 0 AND age >= 45 AND age < 60 GROUP BY gender`);

    // // loop gender
    // ["Male", "Female", "Others"].forEach((gender: string) => {
    //   // get count
    //   const cnt = data.results.filter((value: any) => value.gender == gender);

    //   // set value
    //   if (cnt.length) ageGroupData[gender].push(cnt[0].cnt);
    // });

    // // get age group 60+
    // data = await mysql
    //   .raw(`SELECT COUNT(id) AS cnt, gender FROM patient WHERE deleted = 0 AND age >= 60 GROUP BY gender`);

    // // loop gender
    // ["Male", "Female", "Others"].forEach((gender: string) => {
    //   // get count
    //   const cnt = data.results.filter((value: any) => value.gender == gender);

    //   // set value
    //   if (cnt.length) ageGroupData[gender].push(cnt[0].cnt);
    // });

    // // remove if no data
    // if (ageGroupData.Male.length == 0) delete ageGroupData.Male;

    // // remove if no data
    // if (ageGroupData.Female.length == 0) delete ageGroupData.Female;

    // // remove if no data
    // if (ageGroupData.Others.length == 0) delete ageGroupData.Others;

    // // get repeat visit    
    // const repeatVisit: any = { "1": [], "2": [], "3": [], "4+": [] };

    // // get repeat visit 1
    // repeatVisit["1"] = await mysql
    //   .from("appointment")
    //   .select("COUNT(id) AS cnt")
    //   .where(`deleted = 0 AND clinic_id = ${req.params["clinic_id"]} GROUP BY patient_id HAVING cnt = 1`)
    //   .count();

    // // get repeat visit 1
    // repeatVisit["2"] = await mysql
    //   .from("appointment")
    //   .select("COUNT(id) AS cnt")
    //   .where(`deleted = 0 AND clinic_id = ${req.params["clinic_id"]} GROUP BY patient_id HAVING cnt = 2`)
    //   .count();

    // // get repeat visit 1
    // repeatVisit["3"] = await mysql
    //   .from("appointment")
    //   .select("COUNT(id) AS cnt")
    //   .where(`deleted = 0 AND clinic_id = ${req.params["clinic_id"]} GROUP BY patient_id HAVING cnt = 3`)
    //   .count();

    // // get repeat visit 1
    // repeatVisit["4+"] = await mysql
    //   .from("appointment")
    //   .select("COUNT(id) AS cnt")
    //   .where(`deleted = 0 AND clinic_id = ${req.params["clinic_id"]} GROUP BY patient_id HAVING cnt >= 4`)
    //   .count();

    // // get appointment date
    // const appointmentDate = moment().format("YYYY-MM-DD");

    // // get appointment count
    // const appointments = await mysql
    //   .table("appointment")
    //   .where(
    //     `appointment_date BETWEEN '${appointmentDate} 00:00:00' AND '${appointmentDate} 23:59:59' AND clinic_id = ${req.params["clinic_id"]} AND status = 'Scheduled' AND deleted = 0`
    //   )
    //   .count();

    // // get appointment date
    // const createDate = moment().format("YYYY-MM-DD");

    // // get earnings
    // const earnings = await mysql
    //   .from("consultation")
    //   .select("COALESCE(SUM(fees), 0) AS total")
    //   .where(
    //     `created_on BETWEEN '${createDate} 00:00:00' AND '${createDate} 23:59:59' AND clinic_id = ${req.params["clinic_id"]} AND deleted = 0`
    //   )
    //   .one();

    // // get revenue
    // const revenue = await mysql
    //   .from("consultation")
    //   .select("COALESCE(SUM(fees), 0) AS total")
    //   .where(`clinic_id = ${req.params["clinic_id"]} AND deleted = 0`)
    //   .one();

    // // get registered patients
    // const registeredPatients = await mysql
    //   .raw("SELECT COUNT(id) AS cnt, MONTH(registered_on) as mnt, gender FROM patient WHERE deleted = 0 GROUP BY MONTH(registered_on), gender");

    // // let registered patients data
    // const registeredPatientsData: any = {
    //   Male: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //   Female: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //   Others: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    // }

    // // set male data
    // registeredPatients.results.filter((patient: any) => patient.gender == "Male").forEach((patient: any) => { registeredPatientsData.Male[patient.mnt - 1] = patient.cnt });

    // // if no data delete key
    // if (registeredPatientsData.Male.reduce((partialSum: number, a: any) => { return partialSum + Number(a) }, 0) == 0) delete registeredPatientsData.Male;

    // // set female data
    // registeredPatients.results.filter((patient: any) => patient.gender == "Female").forEach((patient: any) => { registeredPatientsData.Female[patient.mnt - 1] = patient.cnt });

    // // if no data delete key
    // if (registeredPatientsData.Female.reduce((partialSum: number, a: any) => { return partialSum + Number(a) }, 0) == 0) delete registeredPatientsData.Female;

    // // set others data
    // registeredPatients.results.filter((patient: any) => patient.gender == "Others").forEach((patient: any) => { registeredPatientsData.Others[patient.mnt - 1] = patient.cnt });

    // // if no data delete key
    // if (registeredPatientsData.Others.reduce((partialSum: number, a: any) => { return partialSum + Number(a) }, 0) == 0) delete registeredPatientsData.Others;

    // // get appointment consultations
    // const appointmentConsultations = await mysql
    //   .raw(`SELECT COUNT(id) AS cnt, MONTH(appointment_date) as mnt, status FROM appointment WHERE clinic_id = ${req.params["clinic_id"]} AND deleted = 0 GROUP BY MONTH(appointment_date), status`);

    // get total orders
    const totalOrders = await mysql
      .raw(`SELECT COUNT(id) AS cnt, MONTH(createdOn) as mnt FROM orders GROUP BY MONTH(createdOn)`);

    // get total issues
    const totalIssues = await mysql
      .raw(`SELECT COUNT(id) AS cnt, MONTH(dateOfProblem) as mnt FROM issue GROUP BY MONTH(dateOfProblem)`);

    // let orders issues data
    const ordersIssuesData: any = {
      Orders: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      Issues: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }

    // set orders data
    totalOrders.results.forEach((order: any) => { ordersIssuesData.Orders[order.mnt - 1] = order.cnt });

    // set issues data
    totalIssues.results.forEach((issue: any) => { ordersIssuesData.Issues[issue.mnt - 1] = issue.cnt });

    // get man vs machine / data
    const manMachine = await mysql.raw(`SELECT SUM(foundTrue) AS foundTrue, SUM(foundFalse) AS foundFalse FROM orders`);

    // machine data
    const machineData = Number(manMachine.results[0].foundTrue);

    // man data
    const manData = Number(manMachine.results[0].foundFalse);

    // get issue count
    const manMachineData: any = {
      // Machine: Math.round(machineData / (machineData + manData) * 100),
      Machine: machineData,
      // Man: Math.round(manData / (machineData + manData) * 100)
      Man: manData
    };

    // get operators
    const operators = await mysql.raw(`SELECT operatorName FROM orders WHERE TRIM(operatorName) != '' GROUP BY operatorName ORDER BY operatorName`);

    // get total orders
    const operatorOrders = await mysql.raw(`SELECT COUNT(id) AS cnt, operatorName FROM orders WHERE TRIM(operatorName) != '' GROUP BY operatorName ORDER BY cnt DESC`);

    // response json data
    res.json({
      operators: operators.total,
      operators_name: operators.results.map((operator: any) => operator.operatorName),
      orders: Object.values(ordersIssuesData.Orders).reduce((partialSum: number, a: any) => { return partialSum + Number(a) }, 0),
      issues: Object.values(issueData).reduce((partialSum: number, a: any) => { return partialSum + Number(a) }, 0),
      issuesRatio: issueData,
      ordersIssues: ordersIssuesData,
      manMachineRatio: manMachineData,
      accuracy: '63%',
      operatorOrders: operatorOrders.results,      
      // repeatVisit: repeatVisit,
      // ageGroup: ageGroupData,
      // registeredPatients: registeredPatientsData,
      // appointmentConsultations: appointmentConsultationsData,
      // appointments: appointments,
      // earnings: Number(earnings.result.total),
      // revenue: Number(revenue.result.total)
    });
  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    res.json({ results: [], total: 0, message: err.message, status: "error" });
  }
});

export default router;
