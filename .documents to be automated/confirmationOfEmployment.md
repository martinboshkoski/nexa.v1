<p style="text-align: justify; font-weight: normal">Врз основа на одредбите од Законот за работните односи, <%-locals.companyName%> со седиште на ул. <%-locals.companyAddress%>, Република Северна Македонија, со ЕМБС <%-locals.companyNumber%>, претставувано од <%-locals.companyManager%>, како работодавач, на ден <%=locals.certificateDate%> година, ја донесе следната:

<h5 style="text-align: center; font-weight: bold">ПОТВРДА</h5>
<h6 style="text-align: center; font-weight: bold">за работен однос на работник</h6>

<p style="text-align: justify; font-weight: normal">Со оваа потврда, <%=locals.companyName%> потврдува дека работникот <%=locals.employeeName%> со адреса на живеење ул.<%=locals.employeeAddress%>, ЕМБГ <%=locals.employeePIN%>, е во редовен работен однос и е ангажиран на работно место „<%=locals.jobPosition%>“. 
<p style="text-align: justify; font-weight: normal">Договорот за вработување со работникот е склучен на <%=locals.agreementDurationType%> 

<% if (locals.definedDuration) {%>
    и тоа до <%-locals.definedDuration%>  година, до кога е и важноста на оваа потврда. Доколку договорот е продолжен, ќе биде издадена и дополнителна потврда соодветна на времетраењето на таквиот договор. 
<%} %>

<p style="text-align: justify; font-weight: normal">Оваа потврда претставува соодветен доказ за работниот однос на горенаведениот работник и истата може да биде искористена пред државни органи, државни институции и сите други државни и/или приватни правни лица.  

<p style="text-align: right; font-weight: normal">За Друштвото

<br>
<table data-pdfmake='{"widths":[250, 250]}'>
        <tr style="border: none">
            <td style="text-align: left;"></td>
            
            <td style="text-align: right;">
            
                <div> _________________________</div>
                <%=locals.companyName%> <%-locals.companyManager%>
            </td>
        </tr>
</table>
