package openerp.openerpresourceserver.repository;

import openerp.openerpresourceserver.entity.Sender;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SenderRepo extends JpaRepository<Sender, UUID> {
    Sender findByName(String name);

    boolean existsByName(String name);

    Sender findByNameAndPhone(String senderName, String senderPhone);
}
