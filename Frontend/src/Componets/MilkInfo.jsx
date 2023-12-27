import React, { useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  getKeyValue,
} from "@nextui-org/react";
import useSWR from "swr";
import { Tfoot, Th, Tr } from "@chakra-ui/react";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function MilkInfo() {
  const [page, setPage] = useState(1);

  const { data, error, isLoading } = useSWR(
    `https://swapi.py4e.com/api/people?page=${page}`,
    fetcher,
    {
      keepPreviousData: true,
    }
  );

  const rowsPerPage = 10;

  const pages = useMemo(() => {
    return data?.count ? Math.ceil(data.count / rowsPerPage) : 0;
  }, [data?.count, rowsPerPage]);

  const loadingState =
    isLoading || data?.results.length === 0 ? "loading" : "idle";

  return (
    <Table
      aria-label="Example table with client async pagination"
      bottomContent={
        pages > 0 ? (
          <>
            <div>
              <Table aria-label="Example static collection table">
                <TableHeader>
                  <TableColumn>Total & Avg</TableColumn>
                  <TableColumn>Avg FAT</TableColumn>
                  <TableColumn>Avg SNF</TableColumn>
                  <TableColumn>Total Milk</TableColumn>
                </TableHeader>
                <TableBody>
                  <TableRow key="1">
                    <TableCell>Tony Reichert</TableCell>
                    <TableCell>4.6</TableCell>
                    <TableCell>7.5</TableCell>
                    <TableCell>100</TableCell>
                  </TableRow>
                  
                </TableBody>
              </Table>
            </div>
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={pages}
                onChange={(page) => setPage(page)}
              />
            </div>
          </>
        ) : null
      }
    >
      <TableHeader>
        
        <TableColumn key="name">Date</TableColumn>
        <TableColumn key="height">FAT</TableColumn>
        <TableColumn key="mass">SNF</TableColumn>
        <TableColumn key="birth_year">Liter</TableColumn>
      </TableHeader>
      <TableBody
        items={data?.results ?? []}
        loadingContent={<Spinner />}
        loadingState={loadingState}
      >
        {(item) => (
          <TableRow key={item?.name} className="hover:bg-blue-500">
            {(columnKey) => (
              <TableCell>{getKeyValue(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
