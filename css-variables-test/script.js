querySelectorAll('li').forEach(function(){
    var color = getComputedStyle(this).getPropertyValue('--main');
    // getPropertyValue is extended to handle custom properties
    // draw_the_Element()
})