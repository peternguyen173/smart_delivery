package openerp.openerpresourceserver.controller;

import jakarta.validation.Valid;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import openerp.openerpresourceserver.dto.*;
import openerp.openerpresourceserver.entity.Order;
import openerp.openerpresourceserver.entity.enumentity.CollectorAssignmentStatus;
import openerp.openerpresourceserver.service.AssignmentService;
import openerp.openerpresourceserver.service.OrderHistoryService;
import openerp.openerpresourceserver.service.OrderService;
import openerp.openerpresourceserver.service.ShipperAssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/smdeli/ordermanager")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderHistoryService orderHistoryService;
    private final AssignmentService assignmentService;
    private final ShipperAssignmentService shipperAssignmentService;
    // Dùng HashMap làm bộ nhớ tạm, có thể thay thế bằng Redis để lưu trữ lâu dài
    private Map<UUID, LocalDate> lastAssignedDate = new HashMap<>();



    // Create an order
    @PostMapping("/order/add")
    public ResponseEntity<Order> createOrder(Principal principal, @Valid @RequestBody OrderRequestDto orderRequest) {
        System.out.println("OrderController.createOrder: " + orderRequest);
        Order createdOrder = orderService.createOrder(principal, orderRequest);
        return ResponseEntity.ok(createdOrder);
    }

    // Get all orders
    @GetMapping("/order")
    public ResponseEntity<List<OrderSummaryDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/order/hub/{hubId}")
    public ResponseEntity<List<OrderSummaryDTO>> getAllOrdersByHubId(@PathVariable UUID hubId) {
        return ResponseEntity.ok(orderService.getAllOrdersByHubId(hubId));
    }

    @GetMapping("/order/sender/{username}")
    public ResponseEntity<List<OrderSummaryDTO>> getAllOrdersByCreatedByUsername(@PathVariable String username) {
        return ResponseEntity.ok(orderService.getOrderByUsername(username));
    }


    @GetMapping("/order/hub/today/{hubId}")
    public ResponseEntity<List<OrderSummaryDTO>> getAllOrdersTodayByHubId(@PathVariable UUID hubId){
        return ResponseEntity.ok(orderService.getAllOrdersByHubIdToday(hubId));
    }

    @GetMapping("/order/delivered/hub/{hubId}")
    public ResponseEntity<List<OrderSummaryDTO>> getAllOrdersDeliveredInHub(@PathVariable UUID hubId) {
        return ResponseEntity.ok(orderService.getAllOrdersDeliveredInHub(hubId));
    }

    // Get order by ID
    @GetMapping("/order/{id}")
    public ResponseEntity<OrderResponseDto> getOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    // Edit an existing order
    @PutMapping("/order/update/{id}")
    public ResponseEntity<Order> updateOrder(Principal principal, @PathVariable UUID id, @Valid @RequestBody OrderRequestDto orderRequest) {
        Order updatedOrder = orderService.editOrder(principal, id, orderRequest);
        return ResponseEntity.ok(updatedOrder);
    }

    // Delete an order
    @DeleteMapping("/order/delete/{id}")
    public ResponseEntity<Void> deleteOrder(Principal principal, @PathVariable UUID id) {
        orderService.deleteOrder(principal,id);
        return ResponseEntity.noContent().build();  // Return 204 No Content on successful deletion
    }

    @PostMapping("/order/assign/collector")
    public ResponseEntity<List<OrderResponseCollectorShipperDto>> assignOrderToCollector(@RequestBody AssignOrderDto request) {
        // Xử lý kiểm tra ngày đã gọi API
        UUID userId = request.getHubId(); // Hoặc sử dụng một ID người dùng cụ thể nếu cần
        LocalDate today = LocalDate.now();

        if (lastAssignedDate.containsKey(userId)) {
            LocalDate lastAssigned = lastAssignedDate.get(userId);
//            if (lastAssigned.equals(today)) {
//                // Nếu đã gọi API trong ngày, trả về lỗi
//                return ResponseEntity.badRequest().body(null);
//            }
        }

        // Nếu chưa gọi API hôm nay, tiếp tục xử lý yêu cầu
        List<OrderResponseCollectorShipperDto> response = orderService.autoAssignOrderToCollector(request.getHubId(),
                request.getOrders(),
                request.getEmployees());

        // Lưu trữ thời gian gọi API
        lastAssignedDate.put(userId, today);

        return ResponseEntity.ok(response);
    }

//    // Get
//    @GetMapping("/order/assign/collector/today/{hubId}")
//    public ResponseEntity<List<TodayAssignmentDto>> getAssignmentTodayByHubId(@PathVariable UUID hubId) {
//        return ResponseEntity.ok(orderService.getAssignmentTodayByHubId(hubId));
//    }
    @GetMapping("/order/assign/hub/shipper/today/{hubId}")
    public ResponseEntity<List<TodayAssignmentShipperDto>> getShipperAssignmentTodayByHubId(@PathVariable UUID hubId) {
        return ResponseEntity.ok(shipperAssignmentService.getShipperAssignmentsTodayByHub(hubId));
    }
    @GetMapping("/order/assign/shipper/today/{shipperId}")
    public ResponseEntity<List<AssignOrderShipperDto>> getShipperAssignmentTodayByShipperId(@PathVariable UUID shipperId) {
        return ResponseEntity.ok(shipperAssignmentService.getShipperAssignmentsToday(shipperId));
    }


//    @GetMapping("/order/assign/today/collector/{collectorId}")
//    public ResponseEntity<List<AssignOrderCollectorDTO>> getAssignmentTodayByCollectorId(@PathVariable UUID collectorId) {
//        return ResponseEntity.ok(orderService.getAssignmentTodayByCollectorId(collectorId));
//    }
    /**
     * Get order history for collector with order details
     */
    @PreAuthorize("hasRole('COLLECTOR')")
    @GetMapping("/order/history/collector/{collectorId}")
    public ResponseEntity<List<CollectorOrderHistoryDto>> getCollectorOrderHistory(
            @PathVariable UUID collectorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(orderService.getCollectorOrderHistory(collectorId, startDate, endDate));
    }
    /**
     * Get order history for shipper with order details
     */
    @PreAuthorize("hasRole('SHIPPER')")
    @GetMapping("/order/history/shipper/{shipperId}")
    public ResponseEntity<List<ShipperOrderHistoryDto>> getShipperOrderHistory(
            @PathVariable UUID shipperId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(orderService.getShipperOrderHistory(shipperId, startDate, endDate));
    }
//    @PutMapping("/order/assignment/collector")
//    public ResponseEntity<?> updateAssignment(@RequestBody UpdateAssignmentRequest request, Principal principal) {
//        try {
//            assignmentService.updateAssignmentStatus(principal, request.getAssignmentId(), request.getStatus());
//            return ResponseEntity.ok("Assignment updated successfully");
//        } catch (NotFoundException e) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong");
//        }
//    }

    /**
     * Update assignment status
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SHIPPER')")
    @PutMapping("/order/assignment/shipper")
    public ResponseEntity<?> updateShipperAssignment(Principal principal,@Valid @RequestBody UpdateShipperAssignmentRequestDto request) {
        try {
            shipperAssignmentService.updateAssignmentStatus(principal,request.getAssignmentId(), request.getStatus());
            return ResponseEntity.ok("Assignment updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update assignment: " + e.getMessage());
        }
    }
    @PreAuthorize("hasAnyRole('HUB_STAFF', 'HUB_MANAGER')")
    @PutMapping("/order/assignment/pickups/confirmation/{orderId}")
    public  ResponseEntity<?> confirmOrderInHub(@PathVariable UUID orderId){

        return null;
    }

    @PreAuthorize("hasAnyRole('HUB_STAFF', 'HUB_MANAGER')")
    @GetMapping("/order/collected-hub/{hubId}")
    public  ResponseEntity<List<OrderSummaryDTO>> getCollectedHubList(@PathVariable UUID hubId){
        return ResponseEntity.ok(orderService.getCollectedHubList(hubId));
    }
//    @PreAuthorize("hasAnyRole('HUB_STAFF', 'HUB_MANAGER')")
//    @GetMapping("/order/collected-hub/{vehicleId}/{hubId}")
//    public  ResponseEntity<List<OrderSummaryDTO>> getCollectedHubListVehicle(@PathVariable UUID hubId,@PathVariable UUID vehicleId){
//        return ResponseEntity.ok(orderService.getCollectedHubListVehicle(vehicleId, hubId));
//    }


    @PreAuthorize("hasAnyRole('HUB_STAFF', 'HUB_MANAGER')")
    @PutMapping("/collected-hub/complete/{orderIds}")
    public ResponseEntity<String> confirmCollectedHub(Principal principal, @PathVariable UUID[] orderIds) {
        return orderService.confirmCollectedHub(principal, orderIds) ? ResponseEntity.ok("OK") :
                new ResponseEntity<>("FAIL", HttpStatus.INTERNAL_SERVER_ERROR);
    }


        @PreAuthorize("hasAnyRole('HUB_STAFF', 'HUB_MANAGER')")
        @PutMapping("/out-hub/complete/{orderIds}/{vehicleId}")
        public ResponseEntity<String> confirmOutHub(Principal principal, @PathVariable UUID[] orderIds, @PathVariable UUID vehicleId) {
            return orderService.confirmOutHub(principal,orderIds, vehicleId) ? ResponseEntity.ok("OK") :
                    new ResponseEntity<>("FAIL", HttpStatus.INTERNAL_SERVER_ERROR);
        }



    /**
     * Get the complete history of an order
     */
    @GetMapping("/order/{orderId}/history")
    public ResponseEntity<List<OrderHistoryResponseDto>> getOrderHistory(@PathVariable UUID orderId) {
        return ResponseEntity.ok(orderHistoryService.getOrderHistory(orderId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'HUB_MANAGER', 'HUB_STAFF')")
    @GetMapping("/order/collected-collector/{hubId}")
    public ResponseEntity<List<OrderSummaryDTO>> getCollectedCollectorOrders(@PathVariable UUID hubId) {
        return ResponseEntity.ok(orderService.getCollectedCollectorOrders(hubId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'HUB_MANAGER', 'HUB_STAFF')")
    @GetMapping("/order/delivered-driver/{hubId}")
    public ResponseEntity<List<TripOrderSummaryDto>> getDeliveredDriverOrders(@PathVariable UUID hubId) {
        return ResponseEntity.ok(orderService.getDeliveredDriverOrders(hubId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'HUB_MANAGER', 'HUB_STAFF')")
    @GetMapping("/order/delivered-failed/{hubId}")
    public ResponseEntity<List<OrderSummaryDTO>> getFailedDeliveryOrders(@PathVariable UUID hubId) {
        return ResponseEntity.ok(orderService.getFailedDeliveryOrders(hubId));
    }
    @PreAuthorize("hasAnyRole('ADMIN', 'HUB_MANAGER', 'HUB_STAFF', 'SHIPPER')")
    @GetMapping("/order/shipped-failed/{hubId}")
    public ResponseEntity<List<OrderSummaryDTO>> getFailedShippedOrders(@PathVariable UUID hubId) {
        return ResponseEntity.ok(orderService.getFailedShippedOrders(hubId));
    }
    @PreAuthorize("hasAnyRole('ADMIN', 'HUB_MANAGER', 'HUB_STAFF')")
    @PutMapping("/order/confirm-in-hub/{orderIds}")
    public ResponseEntity<String> confirmOrdersIntoHub(
            @PathVariable String orderIds,
            Principal principal) {
        String[] ids = orderIds.split(",");
        UUID[] orderUUIDs = Arrays.stream(ids)
                .map(UUID::fromString)
                .toArray(UUID[]::new);

        boolean success = orderService.confirmOrdersIntoHub(principal, orderUUIDs);
        return success ? ResponseEntity.ok("Success") :
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed");
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'HUB_MANAGER', 'HUB_STAFF')")
    @PutMapping("/order/confirm-shipper-pickup/{shipperId}")
    public ResponseEntity<String> confirmShipperPickup(
            @PathVariable UUID shipperId,
            Principal principal) {
        boolean success = orderService.confirmShipperPickup(principal, shipperId);
        return success ? ResponseEntity.ok("Success") :
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed");
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'HUB_MANAGER', 'HUB_STAFF')")
    @PutMapping("/order/confirm-shipper-pickups/{shipperIds}")
    public ResponseEntity<String> confirmMultipleShipperPickups(
            @PathVariable String shipperIds,
            Principal principal) {
        String[] ids = shipperIds.split(",");
        UUID[] shipperUUIDs = Arrays.stream(ids)
                .map(UUID::fromString)
                .toArray(UUID[]::new);

        boolean success = orderService.confirmMultipleShipperPickups(principal, shipperUUIDs);
        return success ? ResponseEntity.ok("Success") :
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed");
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'HUB_MANAGER', 'HUB_STAFF')")
    @GetMapping("/order/shipper-pickup-requests/{hubId}")
    public ResponseEntity<List<TodayAssignmentShipperDto>> getShipperPickupRequests(@PathVariable UUID hubId) {
        return ResponseEntity.ok(orderService.getShipperPickupRequests(hubId));
    }
//    /**
//     * API để lấy đề xuất phân công (không lưu vào database)
//     */
//    @PostMapping("/order/suggest/collector")
//    public ResponseEntity<List<OrderResponseCollectorShipperDto>> suggestOrderAssignment(@RequestBody AssignOrderDto request) {
//        try {
//            // Gọi service để tạo đề xuất phân công
//            List<OrderResponseCollectorShipperDto> suggestions = orderService.suggestOrderToCollectorAssignment(
//                    request.getHubId(),
//                    request.getOrders(),
//                    request.getEmployees()
//            );
//            return ResponseEntity.ok(suggestions);
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(null);
//        }
//    }

//    /**
//     * API để xác nhận phân công (lưu vào database)
//     */
//    @PostMapping("/order/confirm/collector")
//    public ResponseEntity<List<OrderResponseCollectorShipperDto>> confirmOrderAssignment(
//            Principal principal,
//            @RequestBody ConfirmAssignmentDto request) {
//        try {
//            List<OrderResponseCollectorShipperDto> result = orderService.confirmOrderToCollectorAssignment(
//                    principal,
//                    request.getHubId(),
//                    request.getAssignments()
//            );
//            return ResponseEntity.ok(result);
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(null);
//        }
//    }
    @PostMapping("/order/suggest/shipper")
    public ResponseEntity<List<OrderResponseCollectorShipperDto>> suggestShipperAssignment(@RequestBody AssignOrderDto request) {
        try {
            List<OrderResponseCollectorShipperDto> suggestions = shipperAssignmentService.suggestOrdersToShippers(
                    request.getHubId(),
                    request.getOrders(),
                    request.getEmployees()
            );
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @PostMapping("/order/confirm/shipper")
    public ResponseEntity<List<OrderResponseCollectorShipperDto>> confirmShipperAssignment(
            Principal principal,
            @RequestBody ConfirmAssignmentDto request) {
        try {
            List<OrderResponseCollectorShipperDto> result = shipperAssignmentService.confirmOrdersToShippers(
                    principal,
                    request.getHubId(),
                    request.getAssignments()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
}
