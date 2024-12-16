import React, { useEffect, useState } from "react";
import { request } from "api";
import { StandardTable } from "erp-hust/lib/StandardTable";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from '@mui/icons-material/Visibility';

import MapIcon from "@mui/icons-material/Map";
import { Modal, Box, Typography, Button } from '@mui/material';
import Maps from 'components/map/map';
import {errorNoti, successNoti} from "../../../utils/notification";

function ColectorList() {
    const [shippers, setShippers] = useState([]);
    const [selectedShipper, setSelectedShipper] = useState(null);

    useEffect(() => {
        request("get", "/smdeli/humanresource/shipper", (res) => {
            setShippers(res.data);
        }).then();
    }, []);

    const columns = [
        {
            title: "Mã nhân viên",
            field: "id",
        },
        {
            title: "Tên nhân viên",
            field: "name",
        },
        {
            title: "Số điện thoại",
            field: "phone",
        },
        {
            title: "Email",
            field: "email",
        },
        {
            title: "Thao tác",
            field: "actions",
            sorting: false,
            cellStyle: {
                textAlign: 'center', // Align the content to the left

            },
            headerStyle: {
                textAlign:"center"
            },
            render: (rowData) => (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                    <IconButton
                        style={{ padding: '5px' }}
                        onClick={() => handleEdit(rowData)}
                        color="success"
                    >
                        <VisibilityIcon />
                    </IconButton>
                    <IconButton
                        style={{ padding: '5px' }}
                        onClick={() => handleEdit(rowData)}
                        color="success"
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        style={{ padding: '5px' }}
                        onClick={() => handleDelete(rowData)}
                        color="error"
                    >
                        <DeleteIcon />
                    </IconButton>
                </div>
            ),
        }



    ];


    const handleEdit = (shipper) => {
        window.location.href = `/employee/shipper/update/${shipper.id}`;
    };

    const handleDelete = (shipper) => {
        const isConfirmed = window.confirm(`Bạn có chắc muốn xóa nhân viên giao hàng: ${shipper.name} - Địa chỉ: ${shipper.address}?`);

        if (isConfirmed) {

            request(
                "delete",
                `/smdeli/humanresource/shipper/${shipper.shipperId}`,
                (res) => {
                    if (res.status === 200) {
                        successNoti("Xóa shipper thành công",2000);
                        setShippers(shippers.filter(c => c.shipperId !== shipper.shipperId));
                    }
                },
                (error) => {
                    // Thêm callback cho lỗi
                    errorNoti("Xóa shipper thất bại. Lỗi: " + error.message, 2000);
                }
            );
        }
    };

    return (
        <div>
            <StandardTable
                title="Danh sách nhân viên giao hàng"
                columns={columns}
                data={shippers}
                options={{
                    selection: false,
                    pageSize: 20,
                    search: true,
                    sorting: true,
                }}
            />
        </div>
    );
}

export default ColectorList;
