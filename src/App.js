import React, { useState } from "react";
import * as XLSX from "xlsx";
import Footer from "./components/Footer/Footer";
import diwizonImg from "./asset/Diwizon_Logo_White_BG-removebg-preview.png";


const App = () => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [mergedData, setMergedData] = useState([]);

  const handleFileChange1 = async (e) => {
    const file = e.target.files[0];
    setFile1(file);
    const data = await readExcel(file);
    setData1(data);
  };

  const handleFileChange2 = async (e) => {
    const file = e.target.files[0];
    setFile2(file);
    const fileName = file.name;

    // Check file extension for appropriate parsing:
    if (fileName.endsWith(".csv")) {
      try {
        const data = await readCSV(file);
        setData2(data);
      } catch (error) {
        console.error("Error reading CSV file:", error);
        // Handle errors appropriately (e.g., display an error message to the user)
      }
    } else if (fileName.endsWith(".xlsx")) {
      try {
        const data = await readExcel(file); // Assuming you have a readExcel function
        setData2(data);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        // Handle errors appropriately
      }
    } else {
      console.warn("Invalid file type. Please upload a CSV or Excel file.");
      // Optionally, clear any previously set data2
    }
  };

  const readExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData;
  };

  const readCSV = async (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const csvData = e.target.result;
      const jsonData = convertCSVToJson(csvData);
      setData2(jsonData);
    };
    reader.readAsText(file);
  };

  
  const convertCSVToJson = (csvData) => {
    const lines = csvData.trim().split("\n");
    
    // Split the header line, accounting for quoted commas
    const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(header => header.trim());

    const result = [];

    for (let i = 1; i < lines.length; i++) {
        // Split each line, accounting for quoted commas
        const currentLine = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(value => value.trim());

        // Skip empty lines
        if (currentLine.length === 1 && currentLine[0] === '') continue;

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            // Handle missing values or empty strings
            obj[headers[j]] = currentLine[j] !== undefined ? currentLine[j].replace(/^"|"$/g, '') || null : null;
        }

        result.push(obj);
    }

    return result;
};



   

  const removeTrailingZeros = (value) => {
    try {
      // Ensure value is a string
      value = value.toString();
      // removing starting zeros
      while (value[0] === "0" || value[0] === " "){
        value = value.slice(1);
      }
      return value;
    } catch (error) {
      return " ";
    }
  };

  const mergeData = () => {
    if (data1 && data2) {
      const mergedArray = [];
      const filteredData1 = [];

      // Filter data1 to get all Barcodes where Qty is 0
      data1.forEach((item) => {
        if (item.Qty === 0) {
          filteredData1.push(removeTrailingZeros(item.Barcode));
        }
      });

      //Filter data2 based on the filtered Barcodes from data1
      const filteredData2 = data2.filter((item) => filteredData1.includes(removeTrailingZeros(item["Variant SKU"])))
      .map((item) => removeTrailingZeros(item["Variant SKU"]));
      

      // Merge data1 and data2 based on Barcode and Variant SKU
      data1.forEach((item1) => {
        if (filteredData2.includes(removeTrailingZeros(item1.Barcode))) {
          const matchingItem = data2.find(
            (item) =>
              removeTrailingZeros(item["Variant SKU"]) ===
              removeTrailingZeros(item1.Barcode)
          );
          if (matchingItem) {
            mergedArray.push({
              Barcode: item1["Barcode"],
              handle: matchingItem["Handle"],
              ProductionName: item1["Product Name"],
              qty: item1["Qty"],
              variantInventoryQty: matchingItem["Variant Inventory Qty"],
            });
          }
        }
      });

     // console.log("merged data ",mergedArray);

      setMergedData(mergedArray);
    //  console.log("mergedData", mergedArray);

      if (mergedArray.length > 0) {
        // Generate Excel file from merged data
        const worksheet = XLSX.utils.json_to_sheet(mergedArray);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Merged Data");
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });

        const blob = new Blob([excelBuffer], {
          type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "merged_data.xlsx";
        a.click();
        URL.revokeObjectURL(url);
        console.log("URL", url);
      } else {
        alert("No Common Data In This");
      }
    }
  };

  console.log("data1", data1);
  console.log("data2", data2);
  console.log("mergedData", mergedData);

  return (
    <>
      <div className="header">
        <div>
          <img src={diwizonImg} alt="" />
        </div>
        <div className="container">
          <h1>Sequinze Inventory Comparison</h1>
          <div className="input_div">
            <h3>Offline Excel</h3>
            <input
              type="file"
              onChange={handleFileChange1}
              className="input1"
            ></input>
          </div>
          <div className="input_div">
            <h3>Online Excel</h3>
            <input
              type="file"
              onChange={handleFileChange2}
              className="input2"
            ></input>
          </div>
          <button onClick={mergeData} className="btn">
            Get Summary
          </button>
          {mergedData.length > 0 ? (
            <div className="success-message" style={{ color: "green" }}>
              Data has been successfully summarized
            </div>
          ) : (
            <div className="warning-message" style={{ color: "red" }}>
              Warning: No data for Process
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default App;