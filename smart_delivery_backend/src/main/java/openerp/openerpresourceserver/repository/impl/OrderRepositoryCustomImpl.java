package openerp.openerpresourceserver.repository.impl;

import openerp.openerpresourceserver.dto.OrderSummaryDTO;
import openerp.openerpresourceserver.repository.OrderRepositoryCustom;
import openerp.openerpresourceserver.utils.SqlQueryUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class OrderRepositoryCustomImpl implements OrderRepositoryCustom {

    @Autowired
    private SqlQueryUtil sqlQueryUtil;

    @Override
    public List<OrderSummaryDTO> findOrdersCreatedToday(UUID hubId) {
        StringBuilder SQL = new StringBuilder();
        SQL.append("SELECT * FROM smartdelivery_order ");
        SQL.append("WHERE status = 'PENDING' ");
        SQL.append("AND origin_hub = :hubId"); // Thêm điều kiện lọc theo hubId

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("hubId", hubId);

        return sqlQueryUtil.queryForList(SQL.toString(), params, OrderSummaryDTO.class);
    }


}
