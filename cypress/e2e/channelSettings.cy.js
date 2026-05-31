describe('Channel Settings E2E', () => {
  beforeEach(() => {
    // Giả lập trạng thái đăng nhập
    cy.visit('/login');
    cy.get('input[type="email"]').type('tester@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/channels');
  });

  it('should open channel settings and update name', () => {
    // Hover và click vào icon bánh răng của channel "general"
    cy.contains('general').parent().find('.settings-icon').click({ force: true });
    
    // Đảm bảo modal hiện lên
    cy.contains('Tổng quan').should('be.visible');
    
    // Đổi tên kênh
    cy.get('input[placeholder="nhập-tên-kênh"]').clear().type('general-updated');
    
    // Lưu thay đổi
    cy.contains('Lưu Thay Đổi').click();
    
    // Đóng modal
    cy.get('body').type('{esc}');
    
    // Đảm bảo tên kênh thay đổi trên sidebar
    cy.contains('general-updated').should('be.visible');
  });
});
