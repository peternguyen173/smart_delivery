package openerp.openerpresourceserver.service.impl;
import java.sql.Timestamp;
import java.util.stream.Collectors;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import openerp.openerpresourceserver.dto.*;
import openerp.openerpresourceserver.entity.*;
import openerp.openerpresourceserver.entity.enumentity.OrderStatus;
import openerp.openerpresourceserver.mapper.OrderMapper;
import openerp.openerpresourceserver.repository.*;
import openerp.openerpresourceserver.service.AssignOrderToHubService;
import openerp.openerpresourceserver.service.OrderService;
import openerp.openerpresourceserver.utils.GAAutoAssign.GAAutoAssign;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static openerp.openerpresourceserver.utils.DistanceCalculator.calculateDistance;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderServiceImpl.class);

    @Autowired
    private GAAutoAssign gaAutoAssign;
    @Autowired
    private OrderRepo orderRepo;

    private final OrderMapper orderMapper = OrderMapper.INSTANCE;

    @Autowired
    private AssignOrderCollectorRepository assignOrderCollectorRepository;
    @Autowired
    private OrderItemRepo orderItemRepo;

    @Autowired
    private AssignOrderToHubService assignOrderToHubService;

    @Autowired
    private SenderRepo senderRepo;

    @Autowired
    private RecipientRepo recipientRepo;
    @Autowired
    private HubRepo hubRepo;
    @Autowired
    private CollectorRepo collectorRepo;

    // Create order method
    @Override
    @Transactional
    public Order createOrder(Principal principal, OrderRequestDto orderREQ) {
        Order orderEntity = new Order();
        Sender sender = senderRepo.findByNameAndPhone(orderREQ.getSenderName(),orderREQ.getSenderPhone());
        Recipient recipient = recipientRepo.findByNameAndPhone(orderREQ.getRecipientName(), orderREQ.getRecipientPhone());


        if (sender == null) {
            sender = new Sender(orderREQ.getSenderName(), orderREQ.getSenderPhone(), orderREQ.getSenderEmail(), orderREQ.getSenderAddress());
            sender.setLatitude(orderREQ.getSenderLatitude());
            sender.setLongitude(orderREQ.getSenderLongitude());
        }

        if (recipient == null) {
            recipient = new Recipient(orderREQ.getRecipientName(), orderREQ.getRecipientPhone(), orderREQ.getRecipientEmail(), orderREQ.getRecipientAddress());
            recipient.setLatitude(orderREQ.getSenderLatitude());
            recipient.setLongitude(orderREQ.getRecipientLongitude());
        }

        orderEntity.setStatus(OrderStatus.PENDING);
        orderEntity.setTotalPrice(orderREQ.getTotalPrice());
        orderEntity.setShippingPrice(orderREQ.getShippingPrice());
        orderEntity.setFinalPrice(orderREQ.getFinalPrice());
        orderEntity.setSenderId(sender.getSenderId());
        orderEntity.setRecipientId(recipient.getRecipientId());
        orderEntity.setOrderType(orderREQ.getOrderType());
        orderEntity.setOrderType(orderREQ.getOrderType());
        List<OrderItem> orderItems = new ArrayList<>();
        List<OrderItem> items = orderREQ.getItems();

        for (OrderItem item : items) {
//            OrderItem orderItem = new OrderItem(item.getName(), item.getQuantity(), item.getWeight(), item.getPrice(), item.getLength(), item.getWidth(), item.getHeight());
            item.setOrderId(orderEntity.getId());
            orderItems.add(item);
        }

        orderItemRepo.saveAll(orderItems);

        orderEntity.setCreatedBy(principal.getName());
        logger.info("Created Order: {}", orderEntity);

        assignOrderToHubService.assignOrderToHub(orderEntity);

        return orderRepo.save(orderEntity);
    }

    // Get all orders method
    @Override
    public List<OrderSummaryDTO> getAllOrders() {
        List<Order> orderList = orderRepo.findAll();
        List<OrderSummaryDTO> orderSummaries = new ArrayList<>();
        for (Order order : orderList) {
            orderSummaries.add(new OrderSummaryDTO(order));
        }
        return orderSummaries;
    }

    @Override
    public List<OrderSummaryDTO> getAllOrdersByHubIdToday(UUID hubId) {
        List<OrderSummaryDTO> orderList = orderRepo.findOrdersCreatedToday(hubId);

        return orderList;
    }


    @Override
    public List<OrderSummaryDTO> getAllOrdersByHubId(UUID hubId) {
        List<Order> orderList = orderRepo.findByOriginHubIdOrderByCreatedAtDesc(hubId);
        List<OrderSummaryDTO> orderSummaries = new ArrayList<>();
        for (Order order : orderList) {
            // Thêm vào danh sách orderResponses
            orderSummaries.add(new OrderSummaryDTO(order));

        }
        return orderSummaries;
    }

    // Get order by ID method
    @Override
    public OrderResponseDto getOrderById(UUID orderId) {
        Order order = orderRepo.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));
        List<OrderItem> orderItems = orderItemRepo.findAllByOrderId(order.getId());
        OrderResponseDto orderResponseDto = OrderResponseDto.builder()
                .id(order.getId())
                .senderId(order.getSenderId())
                .senderName(order.getSenderName())
                .recipientId(order.getRecipientId())
                .recipientName(order.getRecipientName())
                .collectorId(order.getCollectorId())
                .collectorName(order.getCollectorName())
                .shipperId(order.getShipperId())
                .shipperName(order.getShipperName())
                .items(orderItems)
                .orderType(order.getOrderType())
                .collectorName(order.getCollectorName())
                .status(order.getStatus())
                .totalPrice(order.getTotalPrice())
                .shippingPrice(order.getShippingPrice())
                .finalPrice(order.getFinalPrice())
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .createdBy(order.getCreatedBy())
                .approvedBy(order.getApprovedBy())
                .cancelledBy(order.getCancelledBy())
                .createdAt(order.getCreatedAt())
                .build();


        return orderResponseDto;
    }

    // Edit order method
    @Override
    @Transactional
    public Order editOrder(UUID orderId, OrderRequestDto orderREQ) {
        Order existingOrder = orderRepo.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        Sender sender = senderRepo.findByName(orderREQ.getSenderName());
        Recipient recipient = recipientRepo.findByName(orderREQ.getRecipientName());

        if (sender == null) {
            sender = new Sender(orderREQ.getSenderName(), orderREQ.getSenderPhone(), orderREQ.getSenderEmail(), orderREQ.getSenderAddress());
        }

        if (recipient == null) {
            recipient = new Recipient(orderREQ.getRecipientName(), orderREQ.getRecipientPhone(), orderREQ.getRecipientEmail(), orderREQ.getRecipientAddress());
        }

        existingOrder.setSenderId(sender.getSenderId());
        existingOrder.setSenderName(sender.getName());
        existingOrder.setRecipientId(recipient.getRecipientId());
        existingOrder.setRecipientName(recipient.getName());
        existingOrder.setTotalPrice(orderREQ.getTotalPrice());
        existingOrder.setShippingPrice(orderREQ.getShippingPrice());
        existingOrder.setFinalPrice(orderREQ.getFinalPrice());
        existingOrder.setOrderType(orderREQ.getOrderType());
        // Clear existing items and add new ones
        List<OrderItem> orderItems = new ArrayList<>();
        for (OrderItem item : orderREQ.getItems()) {
            OrderItem newOrderItem = new OrderItem(item.getName(), item.getQuantity(), item.getWeight(), item.getPrice(), item.getLength(), item.getWidth(), item.getHeight());
            newOrderItem.setOrderId(existingOrder.getId());
            orderItems.add(newOrderItem);
        }
        existingOrder.setStatus(OrderStatus.PENDING);
        orderItemRepo.saveAll(orderItems);

        return orderRepo.save(existingOrder);
    }

    // Delete order method
    @Override
    @Transactional
    public void deleteOrder(UUID orderId) {
        Order order = orderRepo.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));
        orderItemRepo.deleteAllByOrderId(orderId);
        orderRepo.deleteById(orderId);
        logger.info("Deleted Order with ID: {}", orderId);
    }

    @Override
    public List<OrderResponseDto> autoAssignOrderToCollector(UUID hubId, List<OrderRequestDto> orders, List<EmployeeDTO> collectors) {
        if (hubId == null || orders.isEmpty() || collectors.isEmpty()) {
            throw new RuntimeException("Not valid data");
        }

        // Tìm Hub theo hubId
        Hub hub = hubRepo.findById(hubId).orElseThrow(() ->
                new NotFoundException("Not found hub")
        );

        // Lấy tọa độ của hub
        Double hubLat = hub.getLatitude();
        Double hubLon = hub.getLongitude();

        // Danh sách đơn hàng và collector
        List<Order> orderList = new ArrayList<>();
        List<Collector> collectorList = new ArrayList<>();
        List<OrderResponseDto> assignedOrders = new ArrayList<>();

        // Tính khoảng cách cho từng đơn hàng
        for (OrderRequestDto orderRequest : orders) {
            Order order = orderRepo.findById(orderRequest.getId()).orElseThrow(() ->
                    new NotFoundException("Not found order")
            );
            Sender sender = senderRepo.findById(order.getSenderId()).orElseThrow(() -> new NotFoundException("not found sender"));

            Double distance = calculateDistance(hubLat, hubLon, sender.getLatitude(), sender.getLongitude());
            order.setDistance(distance);
            orderRepo.save(order);
            orderList.add(order);
        }

        // Tạo danh sách collector từ DTO
        for (EmployeeDTO collectorDto : collectors) {
            Collector collector = collectorRepo.findById(collectorDto.getId()).orElseThrow(() ->
                    new NotFoundException("Not found collector")
            );
            collectorList.add(collector);
        }
//
//        // Thuật toán tham lam: phân công đơn hàng cho collector gần nhất
//        for (Order order : orderList) {
//            Collector closestCollector = null;
//            Double minDistance = Double.MAX_VALUE;
//
//            // Tìm collector gần nhất với đơn hàng
//            for (Collector collector : collectorList) {
//                Double distanceToCollector = calculateDistance(
//                        hub.getLatitude(),
//                        hub.getLongitude(),
//                        order.getSender().getLatitude(),
//                        order.getSender().getLongitude()
//                );
//
//                // Nếu collector này gần hơn, cập nhật closestCollector
//                if (distanceToCollector < minDistance) {
//                    minDistance = distanceToCollector;
//                    closestCollector = collector;
//                }
//            }
//
//            // Nếu tìm được collector gần nhất, phân công đơn hàng
//            if (closestCollector != null) {
//                // Cập nhật đơn hàng với collector đã phân công
//                OrderResponse orderResponse = new OrderResponse();
//                orderResponse.setId(order.getId());
//                orderResponse.setCollector(closestCollector);
//                orderResponse.setCollectorName(closestCollector.getName());
//                assignedOrders.add(orderResponse);
//
//                // Cập nhật trạng thái hoặc logic khác sau khi phân công
//                // Có thể cập nhật đơn hàng là đã được phân công cho collector
//                order.setCollector(closestCollector);
//
//                // Loại bỏ collector đã phân công (hoặc có thể cập nhật trạng thái nếu cần)
//                collectorList.remove(closestCollector);
//            }
//        }
//
//        return assignedOrders;
        return gaAutoAssign.autoAssignOrderToCollector(hub,orderList,collectorList);
    }

    // Phương thức để lấy các bản ghi trong ngày hôm nay theo hubId
    public List<TodayAssignmentDto> getAssignmentTodayByHubId(UUID hubId) {
        LocalDate today = LocalDate.now();
        Timestamp startOfDay = Timestamp.valueOf(today.atStartOfDay());
        Timestamp endOfDay = Timestamp.valueOf(today.plusDays(1).atStartOfDay());

        // Giả sử bạn lấy danh sách assignments từ repository
        List<AssignOrderCollector> assignments = assignOrderCollectorRepository.findByHubIdAndCreatedAtBetween(
                hubId,
                startOfDay,
                endOfDay
        );



        // Chuyển đối tượng AssignOrderCollector thành TodayAssignmentDto
        return assignments.stream()
                .collect(Collectors.toMap(
                        assignment -> assignment.getCollectorId(), // Group by collectorId
                        assignment -> TodayAssignmentDto.builder()
                                .collectorId(assignment.getCollectorId()) // ID của collector
                                .collectorName(assignment.getCollectorName()) // Tên collector
                                .numOfOrders(countOrdersForCollector(assignments, assignment.getCollectorId())) // Số đơn hàng
                                .status("ASSIGNED") // Trạng thái
                                .build(),
                        (existing, replacement) -> existing) // Nếu có trùng lặp, giữ lại bản ghi đầu tiên
                ).values().stream() // Lấy danh sách các giá trị (TodayAssignmentDto)
                .sorted(Comparator.comparing(TodayAssignmentDto::getCollectorName)) // Sắp xếp theo collectorId
                .collect(Collectors.toList());
    }

    // Phương thức đếm số đơn hàng cho collectorId trong danh sách assignments
    private Long countOrdersForCollector(List<AssignOrderCollector> assignments, UUID collectorId) {
        return assignments.stream()
                .filter(assignment -> assignment.getCollectorId().equals(collectorId)) // Lọc các assignment theo collectorId
                .count(); // Đếm số lượng
    }


    public List<AssignOrderCollectorDTO> getAssignmentTodayByCollectorId(UUID collectorId) {
        LocalDate today = LocalDate.now();
        Timestamp startOfDay = Timestamp.valueOf(today.atStartOfDay());
        Timestamp endOfDay = Timestamp.valueOf(today.plusDays(1).atStartOfDay());



        // Chuyển đối tượng AssignOrderCollector thành TodayAssignmentDto
        return assignOrderCollectorRepository.findByCollectorIdAndCreatedAtBetween(
                collectorId,
                startOfDay,
                endOfDay
        );
    }
}
