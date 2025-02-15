package openerp.openerpresourceserver.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import openerp.openerpresourceserver.entity.Order;
import openerp.openerpresourceserver.entity.Recipient;
import openerp.openerpresourceserver.entity.Sender;

import java.sql.Timestamp;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderSummaryDTO {

    public OrderSummaryDTO(Order order){
        this.id = order.getId();
        this.sender = order.getSender().getName();
        this.recipient = order.getRecipient().getName();
        this.orderType = order.getOrderType();
        this.status = String.valueOf(order.getStatus());
        this.totalPrice = order.getTotalPrice();
        this.shippingPrice = order.getShippingPrice();
        this.finalPrice = order.getFinalPrice();
        this.createdAt = order.getCreatedAt();
    }

    private UUID id;
    private String sender;
    private String recipient;
    private String orderType;
    private String status;
    private Double totalPrice;
    private Double shippingPrice;
    private Double finalPrice;
    private Timestamp createdAt;
}
