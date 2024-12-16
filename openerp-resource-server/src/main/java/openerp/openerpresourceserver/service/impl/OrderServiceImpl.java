package openerp.openerpresourceserver.service.impl;

import jakarta.transaction.Transactional;
import openerp.openerpresourceserver.entity.Order;
import openerp.openerpresourceserver.entity.OrderItem;
import openerp.openerpresourceserver.entity.Recipient;
import openerp.openerpresourceserver.entity.Sender;
import openerp.openerpresourceserver.entity.enumentity.OrderStatus;
import openerp.openerpresourceserver.repo.*;
import openerp.openerpresourceserver.request.OrderRequest;
import openerp.openerpresourceserver.response.OrderResponse;
import openerp.openerpresourceserver.response.OrderSummaryDTO;
import openerp.openerpresourceserver.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderServiceImpl.class);

    @Autowired
    private OrderRepo orderRepo;

    @Autowired
    private OrderItemRepo orderItemRepo;

    @Autowired
    private SenderRepo senderRepo;

    @Autowired
    private RecipientRepo recipientRepo;

    // Create order method
    @Override
    @Transactional
    public Order createOrder(Principal principal, OrderRequest orderREQ) {
        Order orderEntity = new Order();
        Sender sender = senderRepo.findByName(orderREQ.getSenderName());
        Recipient recipient = recipientRepo.findByName(orderREQ.getRecipientName());

        if (sender == null) {
            sender = new Sender(orderREQ.getSenderName(), orderREQ.getSenderPhone(), orderREQ.getSenderEmail(), orderREQ.getSenderAddress());
        }

        if (recipient == null) {
            recipient = new Recipient(orderREQ.getRecipientName(), orderREQ.getRecipientPhone(), orderREQ.getRecipientEmail(), orderREQ.getRecipientAddress());
        }

        orderEntity.setStatus(OrderStatus.PENDING);
        orderEntity.setTotalPrice(orderREQ.getTotalPrice());
        orderEntity.setShippingPrice(orderREQ.getShippingPrice());
        orderEntity.setFinalPrice(orderREQ.getFinalPrice());
        orderEntity.setSender(sender);
        orderEntity.setRecipient(recipient);
        orderEntity.setOrderType(orderREQ.getOrderType());
        orderEntity.setOrderType(orderREQ.getOrderType());
        List<OrderItem> orderItems = new ArrayList<>();
        List<OrderItem> items = orderREQ.getItems();

        for (OrderItem item : items) {
            OrderItem orderItem = new OrderItem(item.getName(), item.getQuantity(), item.getWeight(), item.getPrice(), item.getLength(), item.getWidth(), item.getHeight());
            orderItem.setOrder(orderEntity);
            orderItems.add(orderItem);
        }

        orderEntity.setItems(orderItems);
        orderEntity.setCreatedBy(principal.getName());
        logger.info("Created Order: {}", orderEntity);

        return orderRepo.save(orderEntity);
    }

    // Get all orders method
    @Override
    public List<OrderSummaryDTO> getAllOrders() {
        List<Order> orderList = orderRepo.findAll();
        List<OrderSummaryDTO> orderSummaries = new ArrayList<>();
        for (Order order : orderList) {
            // Tạo OrderResponse cho từng Order
            OrderSummaryDTO orderSummary = new OrderSummaryDTO();
            orderSummary.setId(order.getId());
            orderSummary.setTotalPrice(order.getTotalPrice());
            orderSummary.setShippingPrice(order.getShippingPrice());
            orderSummary.setFinalPrice(order.getFinalPrice());
            orderSummary.setStatus(order.getStatus().toString());
            orderSummary.setSender(order.getSender().getName());
            orderSummary.setRecipient(order.getRecipient().getName());
            orderSummary.setCreatedAt(order.getCreatedAt());
            orderSummary.setOrderType(order.getOrderType());

            // Thêm vào danh sách orderResponses
            orderSummaries.add(orderSummary);
        }
        return orderSummaries;
    }

    // Get order by ID method
    @Override
    public OrderResponse getOrderById(UUID orderId) {
        Order order = orderRepo.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));
        OrderResponse orderResponse = new OrderResponse(
                order.getId(),
                order.getSender(),
                order.getRecipient(),
                order.getCollector(),
                order.getShipper(),
                order.getItems(),// Lấy thông tin shipper
                order.getOrderType(),        // Lấy loại đơn hàng
                order.getStatus(),           // Lấy trạng thái đơn hàng
                order.getTotalPrice(),       // Tổng giá tiền
                order.getShippingPrice(),        // Giá tiền vận chuyển
                order.getFinalPrice(),       // Giá cuối cùng (sau khi cộng giá ship)
                order.getExpectedDeliveryDate(), // Ngày giao dự kiến
                order.getCreatedBy(),        // Người tạo đơn hàng
                order.getApprovedBy(),       // Người phê duyệt đơn hàng
                order.getCancelledBy(),      // Người hủy đơn hàng (nếu có)
                order.getCreatedAt()         // Thời gian tạo đơn hàng
        );


        return orderResponse;
    }

    // Edit order method
    @Override
    @Transactional
    public Order editOrder(UUID orderId, OrderRequest orderREQ) {
        Order existingOrder = orderRepo.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        Sender sender = senderRepo.findByName(orderREQ.getSenderName());
        Recipient recipient = recipientRepo.findByName(orderREQ.getRecipientName());

        if (sender == null) {
            sender = new Sender(orderREQ.getSenderName(), orderREQ.getSenderPhone(), orderREQ.getSenderEmail(), orderREQ.getSenderAddress());
        }

        if (recipient == null) {
            recipient = new Recipient(orderREQ.getRecipientName(), orderREQ.getRecipientPhone(), orderREQ.getRecipientEmail(), orderREQ.getRecipientAddress());
        }

        existingOrder.setSender(sender);
        existingOrder.setRecipient(recipient);
        existingOrder.setTotalPrice(orderREQ.getTotalPrice());
        existingOrder.setShippingPrice(orderREQ.getShippingPrice());
        existingOrder.setFinalPrice(orderREQ.getFinalPrice());
        existingOrder.setOrderType(orderREQ.getOrderType());
        // Clear existing items and add new ones
        existingOrder.getItems().clear(); // Làm sạch danh sách để thêm mới
        for (OrderItem item : orderREQ.getItems()) {
            OrderItem newOrderItem = new OrderItem(item.getName(), item.getQuantity(), item.getWeight(), item.getPrice(), item.getLength(), item.getWidth(), item.getHeight());
            newOrderItem.setOrder(existingOrder);
            existingOrder.getItems().add(newOrderItem);
        }
        existingOrder.setStatus(OrderStatus.PENDING);

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
}
