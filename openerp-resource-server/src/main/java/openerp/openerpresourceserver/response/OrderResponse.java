package openerp.openerpresourceserver.response;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import openerp.openerpresourceserver.entity.*;
import openerp.openerpresourceserver.entity.enumentity.OrderStatus;


import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponse {
    private UUID id;
    private Sender sender;
    private Recipient recipient;
    private Collector collector;
    private Shipper shipper;
    private List<OrderItem> items;
    private String orderType;
    private OrderStatus status;
    private BigDecimal totalPrice;
    private BigDecimal shippingPrice;
    private BigDecimal finalPrice;
    private Date expectedDeliveryDate;

    private String createdBy;
    private String approvedBy;
    private String cancelledBy;
    private Timestamp createdAt;

}
