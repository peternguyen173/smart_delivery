import React, {useState, useEffect, Fragment, useRef} from 'react';
import useStyles from './CreateOrder.style';
import { request } from 'api';
import { errorNoti, successNoti } from 'utils/notification';
import LoadingScreen from "../../components/common/loading/loading";
import {
    MenuItem,
    Button,
    Box,
    Grid,
    InputAdornment,
    OutlinedInput,
    TextField,
    Typography,
    Modal,
    FormControlLabel, Checkbox
} from '@mui/material';
import Maps from "../../components/map/map";
import SearchBox from "../../components/map/searchBox";
import MapIcon from "@mui/icons-material/Map";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import {Layer, Rect, Stage} from "react-konva";
import {StandardTable} from "erp-hust/lib/StandardTable";
import {useForm} from "react-hook-form";
import {useHistory} from "react-router";
import {useRouteMatch} from "react-router-dom";

const CreateOrder = () => {
    const classes = useStyles();
    const [isLoading, setLoading] = useState(true);
    const [scale, setScale] = useState();
    const { register, errors, handleSubmit, watch, getValues } = useForm();
    const [width, setWidth] = useState();
    const [openModal, setOpenModal] = useState(false);
    const [selectPosition, setSelectPosition] = useState(null);
    const warehouseId = null;
    const isCreateForm = warehouseId == null;
    const history = useHistory();
    const { path } = useRouteMatch();
    // Use to determine what value of Address text field
    // if updateAddress = true -> Address text field = new select address from map
    // else -> current warehouse address or null
    const [selectedField, setSelectedField] = useState(null);

    // Tạo state cho các trường trong form
    const [formData, setFormData] = useState({
        senderName: '',
        senderPhone: '',
        senderEmail: '123@gmail.com',
        senderAddress: '',
        senderLongitude: '',
        senderLatitude: '',
        recipientName: '',
        recipientPhone: '',
        recipientEmail: '1234@gmail.com',
        recipientAddress: '',
        recipientLongitude: '',
        recipientLatitude : ' ',
        items: [{ productId: '', name: '', quantity: 1, weight: 0, price: 0, length:0, width:0, height:0, viewBeforeReceive:false }],
        totalPrice: 0,
        shippingPrice: 200000,
        finalPrice: 0,
        orderType: '', // Thêm trường orderType
        // Thêm trường mới cho kích thước đơn hàng
        length: 0.0, // Thay đổi tên từ packageLength thành length để match với backend
        width: 0.0,  // Thay đổi tên từ packageWidth thành width để match với backend
        height: 0.0, // Thay đổi tên từ packageHeight thành height để match với backend
        weight: 0.0, // Thay đổi tên từ packageWeight thành weight để match với backend
    });

    useEffect(() => {
        setLoading(false); // Giả lập quá trình tải dữ liệu
    }, []);

    const calculateShippingPrice = (weight, length, width, height, orderType = 'Bình thường') => {
        // Tính thể tích (m³)
        const volume = (length * width * height) / 1000000; // chuyển từ cm³ sang m³

        // Tính trọng lượng thể tích (kg) - thường dùng hệ số 200kg/m³ cho vận chuyển
        const volumetricWeight = volume * 200;

        // Lấy trọng lượng tính cước = max(trọng lượng thực tế, trọng lượng thể tích)
        const chargeableWeight = Math.max(weight, volumetricWeight);

        // Bảng giá cước cơ bản (VNĐ/kg)
        const baseRates = {
            'Bình thường': 15000,  // 15,000 VNĐ/kg
            'Nhanh': 20000,       // 20,000 VNĐ/kg
            'Hỏa tốc': 30000      // 30,000 VNĐ/kg
        };

        // Phí tối thiểu
        const minimumFee = 20000; // 20,000 VNĐ

        // Tính phí cước
        const baseRate = baseRates[orderType] || baseRates['Bình thường'];
        let shippingFee = chargeableWeight * baseRate;

        // Áp dụng phí tối thiểu
        shippingFee = Math.max(shippingFee, minimumFee);

        // Làm tròn đến nghìn
        shippingFee = Math.ceil(shippingFee / 1000) * 1000;

        return {
            shippingFee,
            chargeableWeight: Math.round(chargeableWeight * 100) / 100, // làm tròn 2 chữ số thập phân
            volumetricWeight: Math.round(volumetricWeight * 100) / 100,
            volume: Math.round(volume * 1000000) / 1000000 // làm tròn 6 chữ số thập phân
        };
    };
    useEffect(() => {
        const { shippingFee } = calculateShippingPrice(
            formData.weight,
            formData.length,
            formData.width,
            formData.height,
            formData.orderType
        );

        setFormData(prevData => ({
            ...prevData,
            shippingPrice: shippingFee,
            finalPrice: prevData.totalPrice + shippingFee
        }));
    }, [formData.weight, formData.length, formData.width, formData.height, formData.orderType, formData.totalPrice]);

    // Cập nhật phần hiển thị thông tin giá cước trong return JSX
// Thay thế phần hiển thị giá cước hiện tại bằng:
    const shippingInfo = calculateShippingPrice(
        formData.weight,
        formData.length,
        formData.width,
        formData.height,
        formData.orderType
    );

    // Hàm cập nhật giá trị của từng trường
    const handleInputChange = (e, index = null, fieldName = null) => {
        const { name, value } = e.target;
        if (name.startsWith('items') && index !== null && fieldName !== null) {
            const updatedItems = [...formData.items];
            updatedItems[index][fieldName] = value;
            setFormData({ ...formData, items: updatedItems });
        }
        else if(name === 'totalPrice' || name === 'length' || name === 'width' || name === 'height' || name === 'weight'){
            // Đảm bảo các giá trị số là double
            const newValue = parseFloat(value) || 0.0; // Nếu không parse được thì mặc định là 0.0
            setFormData({ ...formData, [name]: newValue });
        }
        else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleCheckboxChange = (index) => (event) => {
        const updatedItems = [...formData.items];
        updatedItems[index].viewBeforeReceive = event.target.checked;
        setFormData({ ...formData, items: updatedItems });
    };

    // Hàm xử lý khi submit form
    const onsubmit = async (e) => {
        const finalFormData = {
            ...formData,
            finalPrice: formData.totalPrice,
            // Đảm bảo các giá trị kích thước không null
            length: formData.length || 0.0,
            width: formData.width || 0.0,
            height: formData.height || 0.0,
            weight: formData.weight || 0.0
        }
        console.log("Submitting data:", finalFormData); // Log dữ liệu để kiểm tra
        request(
            "post",
            "/smdeli/ordermanager/order/add",
            (res) => {
                successNoti('Order created successfully!');
            },
            {
                401: () => { errorNoti("Có lỗi xảy ra. Vui lòng thử lại sau") },
                400: (e) => { errorNoti("Có lỗi xảy ra. Vui lòng thử lại sau") }
            },
            finalFormData
        );
    };

    // Hàm thêm sản phẩm mới
    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productId: '', name: '', quantity: 1, weight: 0, price: 0, length:0, width:0, height:0, viewBeforeReceive:false }]
        });
    };

    // Hàm xóa sản phẩm
    const removeItem = (index) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: updatedItems });
    };
    useEffect(()=>{
        console.log("Updated formData:", formData); // Kiểm tra giá trị sau khi cập nhật

    },[formData])
    useEffect(() => {
        // Tính tổng tiền từ các mặt hàng
        const total = formData.items.reduce((acc, item) => {
            return acc + (item.quantity * item.price);
        }, 0);

        // Cập nhật formData với giá trị tổng tiền mới
        setFormData(prevData => ({
            ...prevData,
            totalPrice: total
        }));
    }, [formData.items]); // Mỗi khi items thay đổi, tính lại totalprice


    return (
        isLoading ? (
            <LoadingScreen />
        ) : (
            <Fragment>
                <Modal open={openModal}
                       onClose={() => setOpenModal(!openModal)}
                       aria-labelledby="modal-modal-title"
                       aria-describedby="modal-modal-description"
                >
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '75%',
                        height: '90%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'background.paper',
                        border: '2px solid #000',
                        boxShadow: 24,
                        p: 4,
                    }}>
                        <Typography variant="h5">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                Chọn vị trí
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition(
                                                (position) => {
                                                    const { latitude, longitude } = position.coords;
                                                    const display_name = `Lat: ${latitude}, Lon: ${longitude}`;
                                                    setSelectPosition({
                                                        lat: latitude,
                                                        lon: longitude,
                                                        display_name,
                                                    });
                                                },
                                                (error) => {
                                                    console.error("Error fetching location: ", error.message);
                                                },
                                                { enableHighAccuracy: true }
                                            );
                                        } else {
                                            alert("Trình duyệt không hỗ trợ lấy vị trí hiện tại!");
                                        }
                                    }}
                                >
                                    Chọn vị trí hiện tại
                                </Button>
                                <Button
                                    variant="contained"
                                    className={classes.addButton}
                                    type="submit"
                                    onClick={() => {
                                        setOpenModal(false);
                                        if (selectedField === 'sender') {
                                            setFormData({
                                                ...formData,
                                                senderLongitude: selectPosition?.lon,
                                                senderLatitude: selectPosition?.lat,
                                                senderAddress: selectPosition?.display_name
                                            });
                                        } else if (selectedField === 'recipient') {
                                            setFormData({
                                                ...formData,
                                                recipientLongitude: selectPosition?.lon,
                                                recipientLatitude: selectPosition?.lat,
                                                recipientAddress: selectPosition?.display_name
                                            });
                                        }
                                    }}
                                >
                                    Lưu
                                </Button>
                            </Box>
                        </Typography>

                        <div style={{
                            display: "flex",
                            flexDirection: "row",
                            width: "100%",
                            height: "100%",
                        }}>
                            <div style={{ width: "50%", height: "90%", marginRight: 10 }}>
                                <Maps selectPosition={selectPosition}
                                      setSelectPosition={setSelectPosition} />
                            </div>
                            <div style={{ width: "50%", height: "90%" }}>
                                <SearchBox selectPosition={selectPosition}
                                           setSelectPosition={setSelectPosition} />
                            </div>
                        </div>
                    </Box>
                </Modal>
                <Box className={classes.warehousePage} >
                    <Grid container justifyContent="space-between"
                          className={classes.headerBox} >
                        <Grid>
                            <Typography variant="h5">
                                {"Tạo đơn hàng mới" }
                            </Typography>
                        </Grid>
                        <Grid className={classes.buttonWrap}>
                            <Button variant="contained" className={classes.addButton}
                                    type="submit" onClick={handleSubmit(onsubmit)} >Lưu</Button>
                        </Grid>
                    </Grid>
                </Box>
                <Box className={classes.bodyBox}>
                    <Box className={classes.formWrap}
                         component="form"
                         onSubmit={handleSubmit(onsubmit)}>

                        {/* Thông tin chung kho */}
                        <Box >
                            <Grid container spacing={2}>
                                <Grid item xs={6.5}>
                                    <Box className={classes.boxInfor}>
                                        <Typography className={classes.inforTitle} variant="h6">
                                            1. Thông tin cơ bản
                                        </Typography>
                                        <Grid container spacing={3} className={classes.inforWrap}>
                                            <Grid item xs={6}>
                                                <Box> {/* Bỏ className={classes.inputWrap} vì nó không tồn tại */}
                                                    <Box className={classes.labelInput}>Người gửi <span style={{ color: 'red' }}>*</span></Box>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        inputRef={register({ required: "Vui lòng điền tên người gửi" })}
                                                        name="senderName"
                                                        error={!!errors.senderName}
                                                        helperText={errors.senderName?.message}
                                                        value={formData.senderName}
                                                        onChange={(e) => handleInputChange(e)}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box>
                                                    <Box className={classes.labelInput}>Số điện thoại <span style={{ color: 'red' }}>*</span></Box>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        inputRef={register({ required: "Vui lòng điền số điện thoại người gửi" })}
                                                        name="senderPhone"
                                                        error={!!errors.senderPhone}
                                                        helperText={errors.senderPhone?.message}
                                                        value={formData.senderPhone}
                                                        onChange={(e) => handleInputChange(e)}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Box className={classes.inputWrap}>
                                                    <Box className={classes.labelInput}>
                                                        Địa chỉ <Button style={{ "margin-bottom": 0 }}
                                                                        onClick={() => {setOpenModal(!openModal);
                                                                            setSelectedField('sender')}}><MapIcon /></Button>
                                                    </Box>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        inputRef={register({ required: "Vui lòng điền địa chỉ người gửi" })}
                                                        name="senderAddress"
                                                        error={!!errors.senderAddress}
                                                        helperText={errors.senderAddress?.message}
                                                        value={formData.senderAddress}
                                                        onClick={() => setSelectedField('sender')}
                                                        onChange={(e) => handleInputChange(e)}
                                                    />
                                                </Box>
                                            </Grid>

                                            {/* === Thông tin người nhận === */}
                                            <Grid item xs={6}>
                                                <Box>
                                                    <Box className={classes.labelInput}>Người nhận <span style={{ color: 'red' }}>*</span></Box>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        inputRef={register({ required: "Vui lòng điền tên người nhận" })}
                                                        name="recipientName"
                                                        error={!!errors.recipientName}
                                                        helperText={errors.recipientName?.message}
                                                        value={formData.recipientName}
                                                        onChange={(e) => handleInputChange(e)}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box>
                                                    <Box className={classes.labelInput}>Số điện thoại <span style={{ color: 'red' }}>*</span></Box>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        inputRef={register({ required: "Vui lòng điền số điện thoại người nhận" })}
                                                        name="recipientPhone"
                                                        error={!!errors.recipientPhone}
                                                        helperText={errors.recipientPhone?.message}
                                                        value={formData.recipientPhone}
                                                        onChange={(e) => handleInputChange(e)}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Box className={classes.inputWrap}>
                                                    <Box className={classes.labelInput}>
                                                        Địa chỉ <span style={{ color: 'red' }}>*</span><Button style={{ "margin-bottom": 0 }}
                                                                        onClick={() => {setOpenModal(!openModal);
                                                                            setSelectedField('recipient')}}><MapIcon /></Button>
                                                    </Box>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        inputRef={register({ required: "Vui lòng điền địa chỉ người nhận" })}
                                                        name="recipientAddress"
                                                        error={!!errors.recipientAddress}
                                                        helperText={errors.recipientAddress?.message}
                                                        value={formData.recipientAddress}
                                                        onClick={() => setSelectedField('recipient')}
                                                        onChange={(e) => handleInputChange(e)}
                                                    />
                                                </Box>
                                            </Grid>

                                            {/* === Dịch vụ & Thu hộ === */}
                                            <Grid item xs={6}>
                                                <Box className={classes.inputWrap}>
                                                    <Box className={classes.labelInput}>
                                                        Dịch vụ chuyển phát <span style={{ color: 'red' }}>*</span>
                                                    </Box>
                                                    <TextField
                                                        select // Dùng select thay vì input text
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        value={formData.orderType}
                                                        onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                                                    >
                                                        {/* Các tùy chọn */}
                                                        <MenuItem value="Bình thường">Bình thường</MenuItem>
                                                        <MenuItem value="Nhanh">Nhanh</MenuItem>
                                                        <MenuItem value="Hỏa tốc">Hỏa tốc</MenuItem>
                                                    </TextField>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box className={classes.inputWrap}>
                                                    <Box className={classes.labelInput}>
                                                        Tiền thu hộ <span style={{ color: 'red' }}>*</span>
                                                    </Box>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        inputRef={register({ required: "Vui lòng điền" })}
                                                        name="totalPrice"
                                                        error={!!errors.totalPrice}
                                                        helperText={errors.totalPrice?.message}
                                                        value={formData.totalPrice}
                                                        onChange={(e) => handleInputChange(e)} // Nếu bạn muốn cho phép thay đổi thủ công, giữ onChange, nếu không thì có thể bỏ
                                                    />
                                                </Box>
                                            </Grid>


                                        </Grid>

                                        {/* Phần thêm kích thước của đơn hàng */}
                                        <Typography className={classes.inforTitle} variant="h6" style={{ marginTop: '20px' }}>
                                            3. Kích thước đơn hàng
                                        </Typography>
                                        <Grid container spacing={3} className={classes.inforWrap}>
                                            <Grid item xs={3}>
                                                <Box className={classes.inputWrap}>
                                                    <Box className={classes.labelInput}>
                                                        Dài (cm) <span style={{ color: 'red' }}>*</span>
                                                    </Box>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        type="number"
                                                        name="length"
                                                        inputProps={{ step: "0.1", min: "0" }}
                                                        value={formData.length}
                                                        onChange={(e) => handleInputChange(e)}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Box className={classes.inputWrap}>
                                                    <Box className={classes.labelInput}>
                                                        Rộng (cm) <span style={{ color: 'red' }}>*</span>
                                                    </Box>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        type="number"
                                                        name="width"
                                                        inputProps={{ step: "0.1", min: "0" }}
                                                        value={formData.width}
                                                        onChange={(e) => handleInputChange(e)}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Box className={classes.inputWrap}>
                                                    <Box className={classes.labelInput}>
                                                        Cao (cm) <span style={{ color: 'red' }}>*</span>
                                                    </Box>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        variant="outlined"
                                                        size="small"
                                                        type="number"
                                                        name="height"
                                                        inputProps={{ step: "0.1", min: "0" }}
                                                        value={formData.height}
                                                        onChange={(e) => handleInputChange(e)}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Box className={classes.inputWrap}>
                                                    <Box className={classes.labelInput}>
                                                        Khối lượng (kg) <span style={{ color: 'red' }}>*</span>
                                                    </Box>
                                                    <TextField
                                                        required
                                                        fullWidth
                                                        variant="outlined"
                                                        size="small"
                                                        type="number"
                                                        name="weight"
                                                        inputProps={{ step: "0.1", min: "0" }}
                                                        value={formData.weight}
                                                        onChange={(e) => handleInputChange(e)}
                                                    />
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>
                                <Grid item xs={5}>
                                    <Box className={classes.boxInfor}>
                                        <Typography className={classes.inforTitle} variant="h6">
                                            2. Hàng hóa
                                        </Typography>
                                        <Grid container spacing={3} className={classes.inforWrap}>
                                            <Grid item xs={12}>
                                                {formData.items.map((item, index) => (
                                                    <Box key={index} className={classes.itemContainer}>
                                                        <Grid container spacing={2}>
                                                            <Grid item xs={6}>
                                                                <Box className={classes.inputWrap}>
                                                                    <Box className={classes.labelInput}>
                                                                        Mã sản phẩm
                                                                    </Box>
                                                                    <TextField
                                                                        fullWidth
                                                                        variant="outlined"
                                                                        size="small"
                                                                        name={`items[${index}].productId`}
                                                                        value={item.productId}
                                                                        onChange={(e) => handleInputChange(e, index, 'productId')}
                                                                    />
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Box className={classes.inputWrap}>
                                                                    <Box className={classes.labelInput}>
                                                                        Tên sản phẩm <span style={{ color: 'red' }}>*</span>
                                                                    </Box>
                                                                    <TextField
                                                                        fullWidth
                                                                        variant="outlined"
                                                                        size="small"
                                                                        name={`items[${index}].name`}
                                                                        value={item.name}
                                                                        onChange={(e) => handleInputChange(e, index, 'name')}
                                                                    />
                                                                </Box>
                                                            </Grid>

                                                            <Grid item xs={6}>
                                                                <Box className={classes.inputWrap}>
                                                                    <Box className={classes.labelInput}>
                                                                        Số lượng
                                                                    </Box>
                                                                    <TextField
                                                                        fullWidth
                                                                        variant="outlined"
                                                                        size="small"
                                                                        type="number"
                                                                        name={`items[${index}].quantity`}
                                                                        value={item.quantity}
                                                                        onChange={(e) => handleInputChange(e, index, 'quantity')}
                                                                    />
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Box className={classes.inputWrap}>
                                                                    <Box className={classes.labelInput}>
                                                                        Khối lượng (kg)
                                                                    </Box>
                                                                    <TextField
                                                                        fullWidth
                                                                        variant="outlined"
                                                                        size="small"
                                                                        type="number"
                                                                        name={`items[${index}].weight`}
                                                                        value={item.weight}
                                                                        onChange={(e) => handleInputChange(e, index, 'weight')}
                                                                    />
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={4}>
                                                                <Box className={classes.inputWrap}>
                                                                    <Box className={classes.labelInput}>
                                                                        Dài(cm)
                                                                    </Box>
                                                                    <TextField
                                                                        fullWidth
                                                                        variant="outlined"
                                                                        size="small"
                                                                        type="number"
                                                                        name={`items[${index}].length`}
                                                                        value={item.length}
                                                                        onChange={(e) => handleInputChange(e, index, 'length')}
                                                                    />
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={4}>
                                                                <Box className={classes.inputWrap}>
                                                                    <Box className={classes.labelInput}>
                                                                        Cao(cm)
                                                                    </Box>
                                                                    <TextField
                                                                        fullWidth
                                                                        variant="outlined"
                                                                        size="small"
                                                                        type="number"
                                                                        name={`items[${index}].height`}
                                                                        value={item.height}
                                                                        onChange={(e) => handleInputChange(e, index, 'height')}
                                                                    />
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={4}>
                                                                <Box className={classes.inputWrap}>
                                                                    <Box className={classes.labelInput}>
                                                                        Rộng(cm)
                                                                    </Box>
                                                                    <TextField
                                                                        fullWidth
                                                                        variant="outlined"
                                                                        size="small"
                                                                        type="number"
                                                                        name={`items[${index}].width`}
                                                                        value={item.width}
                                                                        onChange={(e) => handleInputChange(e, index, 'width')}
                                                                    />
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Box className={classes.inputWrap}>
                                                                    <Box className={classes.labelInput}>
                                                                        Giá (đ)<span style={{ color: 'red' }}>*</span>
                                                                    </Box>
                                                                    <TextField
                                                                        fullWidth
                                                                        variant="outlined"
                                                                        size="small"
                                                                        type="number"
                                                                        step="0.01"
                                                                        name={`items[${index}].price`}
                                                                        value={item.price}
                                                                        onChange={(e) => handleInputChange(e, index, 'price')}
                                                                    />
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                        <br/>
                                                        <Button
                                                            variant="contained"
                                                            color="secondary"
                                                            onClick={() => removeItem(index)}
                                                            className={classes.removeButton}
                                                        >
                                                            Xóa sản phẩm
                                                        </Button>
                                                    </Box>
                                                ))}
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={addItem}
                                                    className={classes.addButton}
                                                >
                                                    Thêm sản phẩm
                                                </Button>
                                            </Grid>
                                        </Grid>

                                    </Box>


                                </Grid>

                            </Grid>
                            <Box className={classes.boxInfor} style={{ margin: 0 }}>
                                <Typography className={classes.inforTitle} variant="h6">
                                    Tiền phí & tiền thu hộ
                                    <input
                                        style={{ display: 'none' }}
                                        id="raised-button-file"
                                        type="file"
                                    />

                                </Typography>
                                {/* Body thông tin chi tiết kho */}
                                {/* Body thông tin chi tiết kho */}
                                <Grid container className={classes.detailWrap} spacing={2}>
                                    <Grid item xs={4}>
                                        <p style={{fontWeight: 'bold'}}>
                                            Tiền thu hộ: {formData.totalPrice.toLocaleString()}đ
                                        </p>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <p style={{fontWeight: 'bold'}}>
                                            Tổng cước: {formData.shippingPrice.toLocaleString()}đ
                                        </p>
                                        <p style={{fontSize: '0.8em', color: '#666'}}>
                                            Trọng lượng tính cước: {shippingInfo.chargeableWeight}kg
                                            {shippingInfo.chargeableWeight > formData.weight &&
                                                ` (Thể tích: ${shippingInfo.volumetricWeight}kg)`
                                            }
                                        </p>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <p style={{fontWeight: 'bold'}}>
                                            Tiền thu người gửi: {formData.shippingPrice.toLocaleString()}đ
                                        </p>
                                    </Grid>
                                </Grid>

                            </Box>
                        </Box>

                    </Box>
                </Box>
            </Fragment>
        )
    );
};
export default CreateOrder;