package openerp.openerpresourceserver.service;

import openerp.openerpresourceserver.request.EmployeeRequest;
import org.keycloak.admin.client.Keycloak;

public interface KeycloakAdminClient {

    Keycloak getKeycloakInstance();

    void createUserInKeycloak(EmployeeRequest employeeRequest);

    void updateUserInKeycloak(EmployeeRequest employeeRequest);
}
