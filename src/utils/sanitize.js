export const sanitizeInput = (text) => {

if(!text) return ""

return text
.replace(/</g,"")
.replace(/>/g,"")
.replace(/script/gi,"")
.replace(/'/g,"")
.replace(/"/g,"")

}