package openerp.openerpresourceserver.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.sql.Timestamp;
import java.util.UUID;

@Data
@AllArgsConstructor
public class AssignOrderCollectorDTO {
    private UUID orderId;
    private String senderAddress;
    private String senderName;
    private String senderPhone;
    private Timestamp orderCreatedAt;
}
