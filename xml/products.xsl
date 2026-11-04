<?xml version="1.0" encoding="UTF-8"?>
<!-- products.xsl: hiển thị products.xml thành bảng giá theo danh mục khi mở trên trình duyệt -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/catalog">
    <html lang="vi">
      <head>
        <meta charset="UTF-8"/>
        <title>Bảng giá UEL Shop</title>
        <link rel="stylesheet" href="../css/base.css"/>
        <link rel="stylesheet" href="../css/components.css"/>
        <style>
          body { padding: 40px var(--gutter); }
          h1 { font-size: var(--step-head); color: var(--navy); }
          h2 { margin: 48px 0 16px; font-size: 1.6rem; }
          td.num { text-align: right; font-variant-numeric: tabular-nums; }
        </style>
      </head>
      <body>
        <h1>Bảng giá UEL Shop</h1>
        <p class="text-soft" style="margin-top:8px"><xsl:value-of select="@count"/> sản phẩm, cập nhật <xsl:value-of select="@generated"/></p>
        <xsl:for-each select="category">
          <h2><xsl:value-of select="@name"/> (<xsl:value-of select="@count"/>)</h2>
          <table class="table">
            <thead><tr><th>Mã</th><th>Tên sản phẩm</th><th>Size</th><th style="text-align:right">Tồn kho</th><th style="text-align:right">Giá</th></tr></thead>
            <tbody>
              <xsl:for-each select="product">
                <xsl:sort select="price" data-type="number"/>
                <tr>
                  <td><xsl:value-of select="@code"/></td>
                  <td><a class="link" href="../product.html?slug={@slug}"><xsl:value-of select="name"/></a></td>
                  <td>
                    <xsl:for-each select="variants/variant[not(@size = preceding-sibling::variant/@size)]">
                      <xsl:value-of select="@size"/><xsl:if test="position() != last()">, </xsl:if>
                    </xsl:for-each>
                  </td>
                  <td class="num"><xsl:value-of select="sum(variants/variant/@stock)"/></td>
                  <td class="num"><xsl:value-of select="format-number(price, '#,###')"/> ₫</td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
