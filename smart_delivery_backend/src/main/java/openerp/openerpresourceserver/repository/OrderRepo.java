package openerp.openerpresourceserver.repository;

import openerp.openerpresourceserver.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepo extends JpaRepository<Order, UUID>, OrderRepositoryCustom {
    @Query("SELECT o FROM Order o JOIN FETCH o.sender JOIN FETCH o.recipient WHERE o.id = :orderId")
    Optional<Order> findByIdWithSenderAndRecipient(@Param("orderId") UUID orderId);



    List<Order> findByOriginHub_HubIdOrderByCreatedAtDesc(UUID hubId);


}
