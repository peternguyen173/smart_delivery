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
public class OrderSummaryDTO {
    private UUID id;
    private String sender;
    private String recipient;
    private String orderType;
    private String status;
    private BigDecimal totalPrice;
    private BigDecimal shippingPrice;
    private BigDecimal finalPrice;
    private Timestamp createdAt;
}
