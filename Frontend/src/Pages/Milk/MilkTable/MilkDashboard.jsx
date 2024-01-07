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
import { getMilkDetails } from "../../../Redux/MilkReducer/action";
import { getFarmersDetails } from "../../../Redux/userReducer/action";
import { Select, SelectItem } from "@nextui-org/react";

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

export default function MilkDashboard() {
  const { data } = useSelector((store) => store.milkReducer);
  const { usersData, isLoading, isError } = useSelector(
    (store) => store.farmerReducer
  );
  const dispatch = useDispatch();
  console.log("milkdash", data);
  const users = data.data || [];
  console.log("milk data", data, usersData);
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "age",
    direction: "ascending",
  });
  const [page, setPage] = React.useState(1);
  const [milkStats, setMilkStats] = React.useState({
    fat: 0,
    snf: 0,
    degree: 0,
    water: 0,
    totalLitters: 0,
    totalEntries:0,
  });
  console.log("milks stats",milkStats);

  const [statUserName, setStatUserName] = React.useState("data not available");
  console.log("milkstats", milkStats);
  const hasSearchFilter = Boolean(filterValue);

  const handleSelectFarmer = (e) => {
    console.log("handle select", e.target.value, e.target.name);
    const paylaod = e.target.value;
    dispatch(getMilkDetails(e.target.value));
   
    findName(e.target.value, filteredItems);
    getMilkStats();
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


  // const handleCalculate=()=>{
  //   console.log("handleCalculate")
  // let [totalFat, totalSnf, totalWater, totalDegree, totalLitters] = [
  //     0, 0, 0, 0, 0,
  //   ];
  //   const tItems = filteredItems.length;
  //   filteredItems.forEach((item) => {
  //     totalFat += item.fat;
  //     totalSnf += item.snf;
  //     totalDegree += item.degree;
  //     totalWater += item.water;
  //     totalLitters += item.litter;
  //   });

  //   console.log(
  //     "milkStatsResults handleCalculate",
  //     totalFat,
  //     totalSnf,
  //     totalLitters,
  //     totalWater,
  //     totalDegree
  //   );
  //   let avgFat = totalFat / tItems;
  //   let avgSnf = totalSnf / tItems;
  //   let avgDegree = totalDegree / tItems;
  //   let avgWater = totalWater / tItems;
  //   let data={
  //     fat: avgFat,
  //     snf: avgSnf,
  //     degree: avgDegree,
  //     water: avgWater,
  //     totalLitters,
  //   }
  //   console.log("handle stats avg",data);
  // setMilkStats(data);
  // }
  const findName = (value, filteredItems) => {

    let x=usersData.users.forEach((user) => {
      if (user.mobile == value ) {
        
        setStatUserName(user.name);
      }
      
     
    });
    
  };
  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

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
      <div className="flex flex-col gap-4">
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
          <div className="flex gap-3">
            <Dropdown>
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
            </Dropdown>
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
        <div className="flex justify-between gap-1.5 items-center">
          <span className="text-default-400 text-small">
            Total {users.length} users
          </span>
          {!usersData.users.length ? (
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
              name="mobile"
              onChange={(e) => handleSelectFarmer(e)}
            >
              {!isLoading &&
                usersData.users &&
                usersData.users.map((user) => (
                  <SelectItem key={user.mobile} value={user.mobile}>
                    {user.name}
                  </SelectItem>
                ))}
            </Select>
          )}

          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={() => onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="15">18</option>
              <option value="15">20</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    onRowsPerPageChange,
    users.length,
    onSearchChange,
    hasSearchFilter,
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
            onPress={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  const getMilkStats = React.useMemo(() => {
    let [totalFat,totalSnf,totalWater,totalDegree,totalLitters]=[0,0,0,0,0];
     const tItems=filteredItems.length;
    if(filteredItems.length>0 && data.data.length>0)
    {
       filteredItems.forEach((item)=>{
        totalFat+=item.fat;
        totalSnf+=item.snf;
        totalDegree+=item.degree;
        totalWater+=item.water; 
        totalLitters+=item.litter;
      })
        console.log("milkStatsResults",totalFat,totalSnf,totalLitters,totalWater,totalDegree)
        let totalStats={
          "fat":roundUpToDecimalPlaces(totalFat/tItems,2),
          "snf":roundUpToDecimalPlaces(totalSnf/tItems,2),
          "degree":roundUpToDecimalPlaces(totalDegree/tItems,2),
          "water": roundUpToDecimalPlaces(totalWater/tItems,2),
          "totalLitters":roundUpToDecimalPlaces(totalLitters,3),
          "totalEntries":tItems,
        }

        setMilkStats(totalStats);
    }
    else{
      console.log("else block")
      setMilkStats({fat: 0,
        snf: 0,
        degree: 0,
        water: 0,
        totalLitters: 0,});
    }
    // let avgFat=totalFat/tItems;
    // let avgSnf=totalSnf/tItems;
    // let avgDegree=totalDegree/tItems;
    // let avgWater=totalWater/tItems;
    // setMilkStats({"fat":avgFat,
    // "snf":avgSnf,
    // "degree":avgDegree,
    // "water":avgWater,
    // "litters":totalLitters})
    return milkStats;
  }, [data,statUserName]);

  function roundUpToDecimalPlaces(number, decimalPlaces) {
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.floor(number * multiplier) / multiplier;
}

  useEffect(() => {}, []);
  return (
    <>
      <Table
        aria-label="Example table with custom cells, pagination and sorting"
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
        <TableBody emptyContent={"No entry found"} items={sortedItems}>
          {(item) => (
            <TableRow key={item._id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* //Arithmatic table  */}
      <div>
        <Table aria-label="Example static collection table">
          <TableHeader>
            <TableColumn>Total & Avg</TableColumn>
            <TableColumn>Total Entries</TableColumn>
            <TableColumn>Avg FAT</TableColumn>
            <TableColumn>Avg SNF</TableColumn>
            <TableColumn>Avg Degree</TableColumn>
            <TableColumn>Total Milk</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow key="1">
              <TableCell>{statUserName}</TableCell>
              <TableCell>{milkStats.totalEntries}</TableCell>
              <TableCell>{milkStats.fat}</TableCell>
              <TableCell>{milkStats.snf}</TableCell>
              <TableCell>{milkStats.degree}</TableCell>
              <TableCell>{milkStats.totalLitters}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}
