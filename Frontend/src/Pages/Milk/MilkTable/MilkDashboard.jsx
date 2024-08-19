"use client"

import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
  Progress,
  
  
} from "@nextui-org/react";
import { PlusIcon } from "../../User/UserTable/PlusIcon";
import { VerticalDotsIcon } from "../../User/UserTable/VerticalDotsIcon";
import { SearchIcon } from "../../User/UserTable/SearchIcon";
import { ChevronDownIcon } from "../../User/UserTable//ChevronDownIcon";
import { columns, statusOptions } from "../../User/UserTable/data";
import { capitalize } from "../../User/UserTable/utils";
import { useDispatch, useSelector } from "react-redux";


import { Select, SelectItem } from "@nextui-org/react";
import { color } from "framer-motion";
import { Heading } from "@chakra-ui/react";
import { Loader } from "../../../Components/Loader";
import { getMilkDetails } from "../../../Redux/Slices/milkSlice";
import { toast } from "react-toastify";

const statusColorMap = {
  active: "success",
  paused: "danger",
  vacation: "warning",
};

const INITIAL_VISIBLE_COLUMNS = [
  "date",
  "shift",
  "fat",
  "snf",
  "degree",
  "litter",
  "actions",
];

function MilkDashboard() {
  // store data
  const { data,loading,error } = useSelector((state) => state.milk);
  const { token, user } = useSelector((state) => state.auth);
  const { farmerData } = useSelector((state) => state.farmer);
//console.log("milk data",data,loading,error)
  const dispatch = useDispatch();
  const users = data==null?[]:data;
  
 // console.log("milkdash", users);
  //console.log("milk data", data,"users data", farmerData);

  //  variabales
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "age",
    direction: "ascending",
  });
  const [dateValues, setDateValues] = useState({
    startDate:'',
    endDate: '',
  });
  const [minDate, setMinDate] = useState(""); // Set initial min date
  const [maxDate, setMaxDate] = useState(""); // Set initial max date
  const [page, setPage] = React.useState(1);
  const [milkStats, setMilkStats] = React.useState([
    {
      fat: 0,
      snf: 0,
      degree: 0,
      water: 0,
      totalLitters: 0,
      totalEntries: 0,
    },
  ]);
  const [statUserName, setStatUserName] = React.useState("data not available");
  
  const hasSearchFilter = Boolean(filterValue);
  const handleDeleteFarmer =()=>{
    toast("User deleted")
  }
  const handleSelectFarmer = (e) => {
   
    const payload = e.target.value;
   

    dispatch(getMilkDetails({ value: payload, token }));

    findName(e.target.value, filteredItems);
  };

  const findName = (value, filteredItems) => {
   
    let x = farmerData.forEach((user) => {
      if (user._id == value) {
        setStatUserName(user.name);
      }
    });
  };

  const handleDateChange = (event, dateType) => {
   
    event.stopPropagation();

    const { value } = event.target;

    // Ensurem that the date is in the correct format (YYYY-MM-DD)
    const formattedDate = new Date(value).toISOString().split("T")[0];
  

    setDateValues((prevValues) => ({
      ...prevValues,
      [dateType]: formattedDate,
    }));

  };

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...users];
    

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(statusFilter).includes(user.status)
      );
    }

    return filteredUsers;
  }, [users, filterValue, statusFilter]);

 

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);


  const sortedItems = React.useMemo(() => {
    return [...items]
      .sort((a, b) => {
        const first = a[sortDescriptor.column];
        const second = b[sortDescriptor.column];
        const cmp = first < second ? -1 : first > second ? 1 : 0;

        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      })
      .filter((item) => {
        const createdDateObj = new Date(item.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true // Use true for 12-hour format with AM/PM
        });
          // .toISOString()
          // .split("T")[0];
       // const createdDateObj = new Date(createdDate);
        const startDateObj = new Date(dateValues.startDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true // Use true for 12-hour format with AM/PM
        });
        const endDateObj = new Date(dateValues.endDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true // Use true for 12-hour format with AM/PM
        });

        if (
          dateValues.startDate !== "" &&
          dateValues.endDate !== "" &&
          createdDateObj >= startDateObj &&
          createdDateObj <= endDateObj
        ) {
          
          return item;
        } else if (dateValues.startDate == "" || dateValues.endDate == "") {
          return item;
        }
      });
  }, [sortDescriptor, items, dateValues]);
 
  const datePiker = React.useMemo(() => {
    const currentDate = new Date();
    //setup min and max date
    // Subtract 15 days
    const twentyDaysAgo = new Date(currentDate);
    twentyDaysAgo.setDate(currentDate.getDate() - 20);
    setMinDate(new Date(twentyDaysAgo).toISOString().split("T")[0]);
    setMaxDate(new Date(currentDate).toISOString().split("T")[0]);
    
  }, []);

  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = user[columnKey];

    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{ radius: "lg", src: user.avatar }}
            description={user.email}
            name={cellValue}
          >
            {user.email}
          </User>
        );
      case "role":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
            <p className="text-bold text-tiny capitalize text-default-400">
              {user.team}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[user.status]}
            size="sm"
            variant="flat"
          >
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <VerticalDotsIcon className="text-default-300" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem>View</DropdownItem>
                <DropdownItem>Edit</DropdownItem>
                <DropdownItem>Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = React.useCallback((e) => {
    consoe.log("row per page", e);
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback((value) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
    setPage(1);
  
  }, []);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4 ">
        <div className="flex justify-between gap-3 items-end">
          {/* <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          /> */}

          {/* //filter by date  */}
          <div className="flex justify-between gap-2 items-end">
            <Input
              name="startDate"
              min={minDate}
              max={new Date().toISOString().split("T")[0]}
              type="date"
              value={dateValues.startDate}
              onChange={(e) => handleDateChange(e, "startDate")}
              className="max-w-22"
              label="Select start date"
              placeholder="Select start Date"
              labelPlacement="outside"
            />

            <Input
              name="endDate"
              min={minDate}
              max={new Date().toISOString().split("T")[0]}
              type="date"
              value={dateValues.endDate}
              onChange={(e) => handleDateChange(e, "endDate")}
              className="max-w-22"
              label="Select end date"
              placeholder="Select end Date"
              labelPlacement="outside"
            />
          </div>
          <div className="flex gap-3">
            {/* <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown> */}
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
                emptyContent="data not available"
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="flex justify-between gap-1.5 items-center mt-2  p-2">
          <span className="text-default-400 text-small">
            Total {sortedItems.length} Entries
          </span>
          {farmerData == [] ? (
            <Progress
              size="sm"
              isIndeterminate
              aria-label="Loading..."
              className="max-w-md"
            />
          ) : (
            <Select
              size={"sm"}
              label="Select an farmer"
              className="max-w-xs"
              name="farmerId"
              
              onChange={(e) => handleSelectFarmer(e)}
            >
              {!loading && farmerData ? (
                farmerData.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name}
                  </SelectItem>
                ))
              ) : (
                <Progress
                  size="sm"
                  isIndeterminate
                  aria-label="Loading..."
                  className="max-w-md"
                />
              )}
            </Select>
          )}

          <label className="flex items-center text-default-400 text-small">
            {/* Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={() => onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="15">20</option>
            </select> */}
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    onRowsPerPageChange,
    users?users.length:0,
    onSearchChange,
    hasSearchFilter,
    dateValues,
    
  ]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={() => setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onClick={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onClick={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  const getMilkStats = React.useMemo(() => {
    let stats = [...sortedItems];
    let [totalFat, totalSnf, totalWater, totalDegree, totalLitters] = [
      0, 0, 0, 0, 0,
    ];
    const tItems = stats.length;
    
    if (stats != []) {
      stats.forEach((item) => {
        totalFat += item.fat;
        totalSnf += item.snf;
        totalDegree += item.degree;
        totalWater += item.water;
        totalLitters += item.litter;
      });
      
      let totalStats = {
        fat: roundUpToDecimalPlaces(totalFat / tItems, 2),
        snf: roundUpToDecimalPlaces(totalSnf / tItems, 2),
        degree: roundUpToDecimalPlaces(totalDegree / tItems, 2),
        water: roundUpToDecimalPlaces(totalWater / tItems, 2),
        totalLitters: roundUpToDecimalPlaces(totalLitters, 3),
        totalEntries: tItems,
      };
      return [totalStats]
      
    } else {
      
      return [{ fat: 0, snf: 0, degree: 0, water: 0, totalLitters: 0 }]
      
    }
    

    //round up function
    function roundUpToDecimalPlaces(number, decimalPlaces) {
      const multiplier = Math.pow(10, decimalPlaces);
      return Math.floor(number * multiplier) / multiplier;
    }
    
   
  },[dateValues,sortedItems]);
 

  useEffect(() => {
    console.log("milk dash render");
  }, [token,farmerData]);
  return (
    <>
    {farmerData.length?
      <Table
        aria-label=" table with custom cells, pagination and sorting"
        isHeaderSticky
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{
          wrapper: "max-h-[382px]",
        }}
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="outside"
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>

        <TableBody
          emptyContent={
            loading  ? "...Loading" : data && data.length==0?"Entry not found":"farmer not selected"
          }
          items={sortedItems}
        >
          {(item) => (
            <TableRow key={item._id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      :
      <div style={{display:"flex",flexDirection:"columns", }}>
       
        <Heading  color={"tomato"} m={"auto"}>{farmerData.err} <p style={{fontSize:"20px",color:"blue"}}>Please try again..!</p></Heading>
      </div>
}

      {/* //Arithmatic table  */}
      <div>{farmerData.length?
        <Table aria-label=" static collection table">
          <TableHeader>
            <TableColumn>Total & Avg</TableColumn>
            <TableColumn>Total Entries</TableColumn>
            <TableColumn>Avg FAT</TableColumn>
            <TableColumn>Avg SNF</TableColumn>
            <TableColumn>Avg Degree / %</TableColumn>
            <TableColumn>Total Milk / L</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              loading || milkStats == [] ? "...Loading" : "No Entry Found"
            }
            items={getMilkStats}
          >
            {(items) => (
              <TableRow key={items.totalEntries}>
                <TableCell>{statUserName ||0}</TableCell>
                <TableCell>{items.totalEntries || 0}</TableCell>
                <TableCell>{items.fat || 0}</TableCell>
                <TableCell>{items.snf || 0}</TableCell>
                <TableCell>{items.degree || 0} </TableCell>
                <TableCell>{items.totalLitters || 0  }</TableCell>
              </TableRow>
            )}
            
          </TableBody>
        </Table>
        :""
          }
      </div>
    </>
  );
}

export default MilkDashboard;
