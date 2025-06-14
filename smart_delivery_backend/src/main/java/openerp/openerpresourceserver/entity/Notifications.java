package openerp.openerpresourceserver.entity;


import jakarta.persistence.*;
import lombok.Data;
import org.apache.james.mime4j.dom.datetime.DateTime;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "smartdelivery_notifications")
@EntityListeners(AuditingEntityListener.class)
public class Notifications {
    public static final String STATUS_CREATED = "NOTIFICATION_CREATED";

    public static final String STATUS_READ = "NOTIFICATION_READ";

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private String content;

    private String fromUser;

    private String toUser;

    private String url;

    private String statusId;
    @LastModifiedDate
    private Date lastUpdatedStamp;

    @CreatedDate
    private Date createdStamp;
}
