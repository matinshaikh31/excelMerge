import React, { useState } from "react";
import * as XLSX from "xlsx";
import Footer from "./components/Footer/Footer";
import diwizonImg from "./asset/Diwizon_Logo_White_BG-removebg-preview.png"
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
    const data = await readExcel(file);
    setData2(data);
  };

  const readExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData;
  };

  const mergeData = () => {
    if (data1 && data2) {
      // Create a map from data2 based on Variant SKU
      const data2Map = new Map(
        data2.map((item) => [item["Variant SKU"], item])
      );

      // Filter data1 to get items where Qty is 0
      const filteredData1 = data1.filter((item) => item.Qty === 0);

      // Merge data based on barcode and Variant SKU
      const merged = filteredData1.map((item1) => {
        const pCode = item1["Barcode"];
        console.log(pCode);
        const matchedRow = data2.filter((item) => {
          console.log(item);
          console.log(item["Variant SKU"], pCode);
          return item["Variant SKU"] === pCode;
        });
        console.log("////////////", matchedRow);

        if (matchedRow.length > 0) {
          return {
            Barcode: item1.Barcode,
            productName: item1["Product Name"],
            qty: item1.Qty,
            handle: matchedRow[0]["Handle"],
            variantInventoryQty: matchedRow[0]["Variant Inventory Qty"],
          };
        }
        return null;
      });
      // .filter((item) => item !== null);

      setMergedData(merged);
      console.log("mergedData", merged);

      const worksheet = XLSX.utils.json_to_sheet(merged);
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
    }
  };

  console.log("data1", data1);
  console.log("data2", data2);
  console.log("mergedData", mergedData);

  return (
    <>
    <div className="header">
      <div>
        <img src={diwizonImg} alt=""/>
      </div>
      <div className="container">
        <h1>
          Sequinze Inventory Comparison
        </h1>
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
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default App;

