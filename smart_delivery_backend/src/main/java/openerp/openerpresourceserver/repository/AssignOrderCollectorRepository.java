package openerp.openerpresourceserver.repository;

import openerp.openerpresourceserver.dto.AssignOrderCollectorDTO;
import openerp.openerpresourceserver.entity.AssignOrderCollector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

@Repository
public interface AssignOrderCollectorRepository extends JpaRepository<AssignOrderCollector, UUID> {
    @Query("select a from AssignOrderCollector a JOIN FETCH a.order where a.order.originHub.hubId = :hubId and a.createdAt between :startDate and :endDate")
    List<AssignOrderCollector> findByHubIdAndCreatedAtBetween(
            @Param("hubId") UUID hubId,
            @Param("startDate") Timestamp startDate,
            @Param("endDate") Timestamp endDate
    );

    @Query("select new openerp.openerpresourceserver.dto.AssignOrderCollectorDTO(" +
            "a.order.id, a.order.sender.address, a.order.sender.name, a.order.sender.phone, a.order.createdAt) " +
            "from AssignOrderCollector a JOIN a.order " +
            "where a.collector.id = :collectorId and a.createdAt between :startDate and :endDate")
    List<AssignOrderCollectorDTO> findByCollectorIdAndCreatedAtBetween(@Param("collectorId") UUID collectorId,
                                                                       @Param("startDate") Timestamp startDate,
                                                                       @Param("endDate") Timestamp endDate);
}
