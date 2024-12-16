package openerp.openerpresourceserver.entity.enumentity;

public enum Role {
        SHIPPER, COLLECTOR, DRIVER;
        public String toKeycloakRole() {
                return "ROLE_" + this.name();
        }
}
