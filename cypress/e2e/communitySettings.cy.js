describe('Community Settings E2E', () => {
  beforeEach(() => {
    // Giả lập trạng thái đăng nhập
    cy.visit('/login');
    // Lưu ý: Các phần này tuỳ thuộc vào UI thực tế
    cy.get('input[type="email"]').type('tester@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/channels');
  });

  it('should open community settings and update name', () => {
    // Click vào tên server ở Header
    cy.get('.server-name-header').click();
    
    // Chọn Server Settings từ dropdown
    cy.contains('Cài đặt máy chủ').click();
    
    // Đảm bảo modal hiện lên
    cy.contains('Hồ Sơ Máy Chủ').should('be.visible');
    
    // Thay đổi tên server
    cy.get('input').first().clear().type('My Awesome Server');
    
    // Lưu thay đổi
    cy.contains('Lưu Thay Đổi').click();
    
    // Đảm bảo thông báo đã được lưu (nếu có) hoặc nút mờ đi
    cy.contains('Lưu Thay Đổi').should('be.disabled');
  });
});
