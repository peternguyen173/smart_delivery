package openerp.openerpresourceserver.repo;

import openerp.openerpresourceserver.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepo extends JpaRepository<Order, UUID> {
    @Query("SELECT o FROM Order o JOIN FETCH o.sender JOIN FETCH o.recipient WHERE o.id = :orderId")
    Optional<Order> findByIdWithSenderAndRecipient(@Param("orderId") UUID orderId);

}
